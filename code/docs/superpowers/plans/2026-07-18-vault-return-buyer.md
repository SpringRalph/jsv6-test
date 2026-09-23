# Vault Return Buyer — Edit-FI & Instant Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new `vault-return-buyer` scenario showing two returning-buyer payment paths: instant payment with vault_id + stored_credential, and edit/saved-payment-methods flow via the `paypal-saved-payment-methods` component.

**Architecture:** One new page (page.tsx) + one client button component (ButtonReturnBuyer.tsx) following existing scenario patterns. Two new server-side order-creation endpoints for the two distinct PayPal API shapes. One modification to the client-token endpoint to support vault-scoped tokens via an optional `vaultId` query parameter. Two new browser helper functions in browser-function.ts.

**Tech Stack:** Next.js App Router (edge runtime), React 19, TypeScript, PayPal JS SDK v6 (`@paypal/paypal-js`), Cloudflare D1 (existing vault DB), Tailwind CSS, Zustand stores.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `app/jsv6-test-cases/advanced/vault-return-buyer/page.tsx` | Create | Page layout: two-column with ProductPanel + CartSummary left, PaymentPlaceholder right |
| `app/jsv6-test-cases/advanced/vault-return-buyer/ButtonReturnBuyer.tsx` | Create | Client component: vault input + Pay Now + SPM element + Execute Order, all SDK wiring |
| `app/api/paypal/order/create/create-order-instant/route.ts` | Create | Server: order with `vault_id` + `stored_credential` at top level (instant capture) |
| `app/api/paypal/order/create/create-order-edit-fi/route.ts` | Create | Server: order with `experience_context.preferred_payment_source.vault_id` (edit-FI flow) |
| `app/api/paypal/client-token/route.ts` | Modify | Accept optional `vaultId` query param → append `&claims[]=vault_id:<vaultId>` to OAuth body |
| `services/paypal-sdk-function/browser-function.ts` | Modify | Add `createOrderInstant()` and `createOrderEditFi()` frontend helpers |

---

### Task 1: Extend client-token endpoint to support vault-scoped tokens

**Files:**
- Modify: `code/app/api/paypal/client-token/route.ts`

- [ ] **Step 1: Read current file to locate the OAuth form construction**

The OAuth token request body is built in `fetchClientTokenFromPayPal()` around line 74 with:
```ts
const form = new URLSearchParams();
form.append("grant_type", "client_credentials");
form.append("response_type", "client_token");
form.append("intent", "sdk_init");
```

- [ ] **Step 2: Add `vaultId` query param extraction and conditional claims append**

In the `GET` function (line 116), extract `vaultId` from the request:

```ts
export async function GET(req: NextRequest) {
  consola.info("  --[/api/paypal/client-token]: HTTP REQUEST received");

  try {
    const vaultId = req.nextUrl.searchParams.get("vaultId") || undefined;
    // ... existing override extraction ...
```

Pass `vaultId` through to `fetchClientTokenFromPayPal` by adding it as a parameter. Change the signature:

```ts
async function fetchClientTokenFromPayPal(
  clientId: string,
  clientSecret: string,
  env: string,
  base: string,
  cacheKey: string,
  authAssertion: string | undefined,
  vaultId: string | undefined,
): Promise<string> {
```

Then in the function body, after `form.append("intent", "sdk_init");`, add:

```ts
    if (vaultId) {
      form.append("claims[]", `vault_id:${vaultId}`);
    }
```

Update the cache key to include vaultId so different vault IDs don't share cached tokens:

```ts
function getCacheKey(clientId: string, env: string, authAssertion: string, vaultId: string | undefined): string {
  return `${clientId}::${env}::${authAssertion}::${vaultId ?? ""}`;
}
```

Update the call sites: in `GET`, pass `vaultId` to `getCacheKey` and `fetchClientTokenFromPayPal`.

- [ ] **Step 3: Verify the change compiles**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test/code && npx tsc --noEmit --pretty 2>&1 | head -30
```

Expected: no new type errors related to `route.ts`.

- [ ] **Step 4: Commit**

```bash
git add code/app/api/paypal/client-token/route.ts
git commit -m "feat: support vault-scoped client tokens via ?vaultId query param"
```

---

### Task 2: Add `createOrderInstant` and `createOrderEditFi` browser helpers

**Files:**
- Modify: `code/services/paypal-sdk-function/browser-function.ts`

- [ ] **Step 1: Add `createOrderInstant` function**

Append after line 130 (`createOrderWithVaultId`):

```ts
export async function createOrderInstant(vaultId: string, fraudnetId: string): Promise<any> {
  return createOrderAPIFactory(
    "/api/paypal/order/create/create-order-instant",
    "paypal",
    { vault_id: vaultId, fraudnet_id: fraudnetId },
  )();
}
```

- [ ] **Step 2: Add `createOrderEditFi` function**

Append after `createOrderInstant`:

```ts
export async function createOrderEditFi(vaultId: string): Promise<any> {
  return createOrderAPIFactory(
    "/api/paypal/order/create/create-order-edit-fi",
    "paypal",
    { vault_id: vaultId },
  )();
}
```

- [ ] **Step 3: Verify compilation**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test/code && npx tsc --noEmit --pretty 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add code/services/paypal-sdk-function/browser-function.ts
git commit -m "feat: add createOrderInstant and createOrderEditFi browser helpers"
```

---

### Task 3: Create the instant-payment order endpoint

**Files:**
- Create: `code/app/api/paypal/order/create/create-order-instant/route.ts`

- [ ] **Step 1: Create the route file**

This endpoint creates an order with `vault_id` + `stored_credential` at top level — no `experience_context`, no popup. PayPal captures synchronously when nothing further is required.

```ts
import { buildBasicAuthHeader, buildPayPalRequestHeaders, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
import { NextResponse } from "next/server";
import consola from "consola";

export const runtime = 'edge';

type Item = {
    id?: string;
    name: string;
    unitPrice: number;
    quantity: number;
};

function generate32CharId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    const extraRandom = Math.random().toString(36).substring(2, 7);
    return (timestamp + randomPart + extraRandom).padEnd(32, '0').slice(0, 32);
}

export async function POST(req: Request) {
    consola.info("[/api/paypal/order/create/create-order-instant] HTTP POST received");
    try {
        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        const basic = buildBasicAuthHeader(clientId, clientSecret);

        const body = await req.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: "invalid request body" }, { status: 400 });
        }

        const items: Item[] = Array.isArray(body.items) ? body.items : [];
        const totalAmount: number = Number(body.totalAmount ?? 0);
        const currency: string = String(body.currency ?? "USD").toUpperCase();
        const paymentDetail = body.paymentDetail ?? {};

        if (items.length === 0 || totalAmount <= 0) {
            return NextResponse.json(
                { error: "items or totalAmount missing/invalid" },
                { status: 400 }
            );
        }

        const paypalItems = items.map((it) => ({
            name: it.name,
            unit_amount: { currency_code: currency, value: it.unitPrice.toFixed(2) },
            quantity: String(it.quantity),
            sku: it.id ?? undefined,
        }));

        const purchaseUnit = {
            amount: {
                currency_code: currency,
                value: totalAmount.toFixed(2),
                breakdown: {
                    item_total: {
                        currency_code: currency,
                        value: totalAmount.toFixed(2),
                    },
                },
            },
            items: paypalItems,
        };

        const vaultId = paymentDetail.vault_id as string | undefined;
        const fraudnetId = paymentDetail.fraudnet_id as string | undefined;

        const orderBody: Record<string, any> = {
            intent: "CAPTURE",
            purchase_units: [purchaseUnit],
            payment_source: {
                paypal: {
                    vault_id: vaultId,
                    stored_credential: {
                        payment_initiator: "CUSTOMER",
                        usage_pattern: "IMMEDIATE",
                        usage: "SUBSEQUENT",
                    },
                },
            },
        };

        consola.debug(JSON.stringify(orderBody, null, "  "));

        const extraHeaders: Record<string, string> = {
            "PayPal-Request-Id": generate32CharId(),
        };
        if (fraudnetId) {
            extraHeaders["PayPal-Client-Metadata-Id"] = fraudnetId;
        }

        const createRes = await fetch(`${base}/v2/checkout/orders`, {
            method: "POST",
            headers: buildPayPalRequestHeaders(req, basic, extraHeaders),
            body: JSON.stringify(orderBody),
        });

        const createText = await createRes.text();
        if (!createRes.ok) {
            let details: any = createText;
            try { details = JSON.parse(createText); } catch { /* raw text */ }
            return NextResponse.json(
                { error: "failed to create paypal order", details },
                { status: 502 }
            );
        }

        const createJson = JSON.parse(createText);
        return NextResponse.json({ order: createJson, orderId: createJson.id });
    } catch (err: any) {
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test/code && npx tsc --noEmit --pretty 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add code/app/api/paypal/order/create/create-order-instant/route.ts
git commit -m "feat: add create-order-instant endpoint (vault_id + stored_credential)"
```

---

### Task 4: Create the edit-FI order endpoint

**Files:**
- Create: `code/app/api/paypal/order/create/create-order-edit-fi/route.ts`

- [ ] **Step 1: Create the route file**

This endpoint creates an order with `experience_context.preferred_payment_source.vault_id` for the edit-FI flow.

```ts
import { buildBasicAuthHeader, buildPayPalRequestHeaders, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
import { NextResponse } from "next/server";
import consola from "consola";

export const runtime = 'edge';

type Item = {
    id?: string;
    name: string;
    unitPrice: number;
    quantity: number;
};

export async function POST(req: Request) {
    consola.info("[/api/paypal/order/create/create-order-edit-fi] HTTP POST received");
    try {
        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        const basic = buildBasicAuthHeader(clientId, clientSecret);

        const body = await req.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: "invalid request body" }, { status: 400 });
        }

        const items: Item[] = Array.isArray(body.items) ? body.items : [];
        const totalAmount: number = Number(body.totalAmount ?? 0);
        const currency: string = String(body.currency ?? "USD").toUpperCase();
        const paymentDetail = body.paymentDetail ?? {};

        if (items.length === 0 || totalAmount <= 0) {
            return NextResponse.json(
                { error: "items or totalAmount missing/invalid" },
                { status: 400 }
            );
        }

        const paypalItems = items.map((it) => ({
            name: it.name,
            unit_amount: { currency_code: currency, value: it.unitPrice.toFixed(2) },
            quantity: String(it.quantity),
            sku: it.id ?? undefined,
        }));

        const purchaseUnit = {
            amount: {
                currency_code: currency,
                value: totalAmount.toFixed(2),
                breakdown: {
                    item_total: {
                        currency_code: currency,
                        value: totalAmount.toFixed(2),
                    },
                },
            },
            items: paypalItems,
        };

        const vaultId = paymentDetail.vault_id as string | undefined;
        const return_url = paymentDetail.endpoint?.return_url || "";
        const cancel_url = paymentDetail.endpoint?.cancel_url || "";

        const orderBody: Record<string, any> = {
            intent: "CAPTURE",
            purchase_units: [purchaseUnit],
            payment_source: {
                paypal: {
                    experience_context: {
                        payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
                        brand_name: "EXAMPLE INC",
                        locale: "en-US",
                        landing_page: "LOGIN",
                        shipping_preference: "GET_FROM_FILE",
                        user_action: "PAY_NOW",
                        return_url: return_url,
                        cancel_url: cancel_url,
                        preferred_payment_source: {
                            vault_id: vaultId,
                        },
                    },
                },
            },
        };

        consola.debug(JSON.stringify(orderBody, null, "  "));

        const createRes = await fetch(`${base}/v2/checkout/orders`, {
            method: "POST",
            headers: buildPayPalRequestHeaders(req, basic),
            body: JSON.stringify(orderBody),
        });

        const createText = await createRes.text();
        if (!createRes.ok) {
            let details: any = createText;
            try { details = JSON.parse(createText); } catch { /* raw text */ }
            return NextResponse.json(
                { error: "failed to create paypal order", details },
                { status: 502 }
            );
        }

        const createJson = JSON.parse(createText);
        return NextResponse.json({ order: createJson, orderId: createJson.id });
    } catch (err: any) {
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test/code && npx tsc --noEmit --pretty 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add code/app/api/paypal/order/create/create-order-edit-fi/route.ts
git commit -m "feat: add create-order-edit-fi endpoint (preferred_payment_source.vault_id)"
```

---

### Task 5: Create the page layout

**Files:**
- Create: `code/app/jsv6-test-cases/advanced/vault-return-buyer/page.tsx`

- [ ] **Step 1: Create page.tsx**

Follow the exact pattern from `vault-save-with-purchase/page.tsx`:

```tsx
import { Container } from "@/components/layout/Container";
import { ProductPanel } from "@/components/panels/ProductPanel";
import { CartSummary } from "@/components/panels/CartSummary";
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
import Link from "next/link";
import PayPalButton from "./ButtonReturnBuyer";
import Image from "next/image";
import { CreditCard } from "lucide-react";

export default function ReturnBuyerPage() {
    return (
        <Container>
            <div className="space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-2xl -z-10" />

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-primary hover:underline mb-4 group"
                    >
                        <span className="text-xl group-hover:-translate-x-1 transition-transform">
                            ⬅️
                        </span>
                        Back to Home
                    </Link>

                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <CreditCard className="size-8 text-blue-500" />
                            Return Buyer — Edit-FI & Instant Payment
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <span className="text-lg">📝</span>
                            Edit saved payment methods + pay instantly with vault ID
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <ProductPanel />
                        <CartSummary />
                    </div>
                    <div>
                        <PaymentPlaceholder
                            scenario="return buyer edit-FI + instant"
                            children={<PayPalButton />}
                            placeHolder=""
                            paymentAreaIcon={
                                <Image
                                    src="/payment-area-icon/paypal.svg"
                                    alt="PayPal"
                                    width={100}
                                    height={100}
                                />
                            }
                        />
                    </div>
                </div>
            </div>
        </Container>
    );
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test/code && npx tsc --noEmit --pretty 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add code/app/jsv6-test-cases/advanced/vault-return-buyer/page.tsx
git commit -m "feat: add vault-return-buyer page layout"
```

---

### Task 6: Create the ButtonReturnBuyer client component

**Files:**
- Create: `code/app/jsv6-test-cases/advanced/vault-return-buyer/ButtonReturnBuyer.tsx`

This is the largest file. It handles:
- SDK initialization with vault-scoped client token (SPM component needs it)
- Vault ID input (pre-filled from active vault, editable)
- "Pay Now" button → `createOrderInstant` → capture if not COMPLETED
- SPM element → `createPayPalEditSavedPaymentSession({commit:false})` → Execute Order button captures
- FraudNet session ID for Pay Now

- [ ] **Step 1: Create ButtonReturnBuyer.tsx**

```tsx
"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { useSdkInitOptions } from "@/hooks/useSdkInitOptions";
import {
    createOrderInstant,
    createOrderEditFi,
    captureOrder,
    handlePaymentError,
    getBrowserSafeClientToken,
} from "@/services/paypal-sdk-function/browser-function";
import {
    AppSdkInstance,
} from "@/services/paypal-sdk-function/paypalSharedObject";
import { safeFindEligibleMethods } from "@/services/paypal-sdk-function/safe-find-eligible-methods";

import React, { useEffect, useState, useRef } from "react";
import consola from "consola";
import toast from "react-hot-toast";
import { EligibilityOverlay } from "@/components/ui/EligibilityOverlay";

// Inline vault-scoped token fetch (not from useSdkInitOptions because
// we need to append ?vaultId=...).
async function fetchVaultScopedClientToken(vaultId: string): Promise<string> {
    const params = new URLSearchParams();
    if (vaultId) params.append("vaultId", vaultId);

    const url = `/api/paypal/client-token${params.toString() ? "?" + params.toString() : ""}`;
    const res = await fetch(url, {
        headers: {
            "x-paypal-client-id": (window as any).__PAYPAL_CLIENT_ID__ || "",
            "x-paypal-secret": (window as any).__PAYPAL_SECRET__ || "",
            "x-paypal-env": (window as any).__PAYPAL_ENV__ || "sandbox",
        },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch vault-scoped client token: ${text}`);
    }
    const json = await res.json();
    if (!json?.clientToken) throw new Error("No clientToken in response");
    return json.clientToken;
}

export default function ButtonReturnBuyer() {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();
    const [isInitializing, setIsInitializing] = useState(false);

    const [vaultId, setVaultId] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [approvedOrderId, setApprovedOrderId] = useState<string | null>(null);
    const [showExecute, setShowExecute] = useState(false);

    // Holders for the mutable session / instance refs so click handlers
    // always use the latest.
    const sdkInstanceRef = useRef<AppSdkInstance | null>(null);
    const editSessionRef = useRef<any>(null);
    const fraudnetIdRef = useRef("");

    // Generate a random fraudnet session ID once per mount
    useEffect(() => {
        fraudnetIdRef.current =
            Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
    }, []);

    // Load active vault on mount
    useEffect(() => {
        if (!ready) return;
        (async () => {
            try {
                const res = await fetch("/api/vault/active");
                if (res.ok) {
                    const { method } = await res.json();
                    if (method) {
                        setVaultId(method.vault_id || "");
                        setCustomerId(method.customer_id || "");
                    }
                }
            } catch {
                // no active vault — user enters manually
            }
        })();
    }, [ready]);

    // Re-initialize SDK whenever vaultId changes (triggered by "Set" button)
    async function initializeWithVault() {
        if (!vaultId.trim()) {
            toast.error("Please enter a vault ID");
            return;
        }

        setApprovedOrderId(null);
        setShowExecute(false);

        try {
            setIsInitializing(true);

            const clientToken = await fetchVaultScopedClientToken(vaultId.trim());

            const paypal = (window as any).paypal;
            const sdkInstance = await paypal.createInstance({
                clientToken,
                components: ["paypal-payments", "paypal-saved-payment-methods", "paypal-messages"],
                pageType: "checkout",
            });
            sdkInstanceRef.current = sdkInstance;

            const paymentMethods = await safeFindEligibleMethods(sdkInstance, {
                currencyCode: "USD",
            });
            if (!paymentMethods) return;
            if (!paymentMethods.isEligible("paypal")) {
                toast.error("PayPal not eligible for this vault");
                return;
            }

            setupEditSavedPaymentSession(sdkInstance);
            setupPayNowButton();
            sdkInstance.createPayPalMessages();

            toast.success("SDK initialized with vault-scoped token");
        } catch (e: any) {
            consola.error("initializeWithVault failed:", e);
            toast.error(`Init failed: ${e.message}`);
        } finally {
            setIsInitializing(false);
        }
    }

    // --- Edit-FI / SPM ---

    function setupEditSavedPaymentSession(sdkInstance: AppSdkInstance) {
        // Remove existing SPM element if present
        const existing = document.querySelector("#spm-element");
        if (existing) existing.remove();

        const el = document.createElement("paypal-saved-payment-methods");
        el.id = "spm-element";
        document.getElementById("spm-container")!.appendChild(el);

        const session = sdkInstance.createPayPalEditSavedPaymentSession({
            commit: false,
            onApprove: async (data: any) => {
                const oid = data.orderId || data.orderID;
                if (!oid) {
                    consola.warn("[edit onApprove] no order id");
                    return;
                }
                setApprovedOrderId(oid);
                setShowExecute(true);
                consola.log("[edit onApprove] approved order:", oid);
                toast.success("Payment method updated — click Execute Order to capture");
            },
            onCancel: (data: any) => {
                consola.log("[edit onCancel]", data);
                toast("Edit cancelled", { icon: "⚠️" });
            },
            onError: (error: any) => {
                consola.error("[edit onError]", error);
                toast.error(`Edit error: ${error.message || JSON.stringify(error)}`);
            },
        });
        editSessionRef.current = session;

        el.addEventListener("click", async () => {
            try {
                const createOrderPromise = createOrderEditFi(vaultId.trim());
                await session.start(
                    { presentationMode: "auto" },
                    createOrderPromise,
                );
            } catch (err) {
                consola.error("SPM session start error:", err);
                handlePaymentError(err);
            }
        });
    }

    // --- Execute Order (capture after edit-FI approval) ---

    async function handleExecuteOrder() {
        if (!approvedOrderId) return;
        try {
            const captureData = await captureOrder({ orderId: approvedOrderId });
            setApprovedOrderId(null);
            setShowExecute(false);
            toast.success(`Order ${captureData.id || ""} captured!`);
        } catch (e: any) {
            toast.error(`Capture failed: ${e.message}`);
        }
    }

    // --- Pay Now (instant) ---

    function setupPayNowButton() {
        // Listener attached via onClick in JSX — this is a no-op placeholder
        // to keep symmetry; actual wiring is in the onClick handler below.
    }

    async function handlePayNow() {
        if (!vaultId.trim()) {
            toast.error("Please enter a vault ID first");
            return;
        }
        const btn = document.querySelector("#pay-now-btn") as HTMLButtonElement | null;
        if (btn) btn.disabled = true;
        try {
            const orderData = await createOrderInstant(vaultId.trim(), fraudnetIdRef.current);
            if (orderData.status === "COMPLETED") {
                toast.success(`Order ${orderData.orderId} completed instantly!`);
                return;
            }
            // Fallback: capture if not already COMPLETED
            const captureData = await captureOrder({ orderId: orderData.orderId });
            toast.success(`Order ${captureData.id || ""} captured!`);
        } catch (e: any) {
            consola.error("Pay Now failed:", e);
            toast.error(`Pay Now failed: ${e.message}`);
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // --- Initial auto-init ---

    useEffect(() => {
        if (!ready) return;
        // Auto-init if vaultId is already loaded from active vault
        if (vaultId.trim()) {
            initializeWithVault();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, vaultId]);

    if (loading) return <div>Loading PayPal SDK…</div>;
    if (error) return <div>PayPal SDK load failed: {error.message}</div>;

    return (
        <div className="relative w-full space-y-4">
            <EligibilityOverlay
                isVisible={isInitializing}
                message="Initializing with vault-scoped token…"
            />

            {/* Vault ID input */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Vault ID</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={vaultId}
                        onChange={(e) => setVaultId(e.target.value)}
                        placeholder="Enter vault ID"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
                    />
                    <button
                        onClick={initializeWithVault}
                        disabled={isInitializing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        Set
                    </button>
                </div>
                {customerId && (
                    <p className="text-xs text-muted-foreground">
                        Customer: <code>{customerId}</code>
                    </p>
                )}
            </div>

            {/* Pay Now — instant one-click */}
            <div>
                <button
                    id="pay-now-btn"
                    onClick={handlePayNow}
                    disabled={isInitializing}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                    ⚡ Pay Now in One Click
                </button>
                <p className="text-xs text-muted-foreground mt-1">
                    Pays instantly with saved vault — no popup.
                </p>
            </div>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
            </div>

            {/* Edit-FI — SPM component */}
            <div>
                <p className="text-sm font-medium mb-2">
                    View / Edit Saved Payment Method
                </p>
                <div
                    id="spm-container"
                    className="min-h-[48px] border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg flex items-center justify-center p-2"
                >
                    <span className="text-sm text-muted-foreground">
                        Click &quot;Set&quot; with a vault ID to load saved methods
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Click the saved payment method above to edit — approve first, then capture.
                </p>
            </div>

            {/* Execute Order (shown after edit-FI approval) */}
            {showExecute && (
                <button
                    onClick={handleExecuteOrder}
                    className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
                >
                    ✅ Execute Order (Capture)
                </button>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test/code && npx tsc --noEmit --pretty 2>&1 | head -50
```

Note: there may be some type errors from `createPayPalEditSavedPaymentSession` — the SDK types may not yet expose this method. If so, use `(sdkInstance as any).createPayPalEditSavedPaymentSession(...)` and add a `// @ts-expect-error` comment with explanation. Similarly for `paypal-saved-payment-methods` JSX element.

- [ ] **Step 3: Commit**

```bash
git add code/app/jsv6-test-cases/advanced/vault-return-buyer/ButtonReturnBuyer.tsx
git commit -m "feat: add ButtonReturnBuyer with Pay Now + Edit-FI + SPM component"
```

---

### Task 7: Add navigation entry to home page

**Files:**
- Find and modify the home page that lists advanced scenarios

- [ ] **Step 1: Locate the home page or scenario index**

```bash
grep -r "vault-save-with-purchase\|vault-recurring\|vault-save-payment" /Users/yqiang/Documents/paypal-work/jsv6-test/code/app --include="*.tsx" -l | grep -v node_modules
```

Expected: find the page that lists scenario links (likely `app/page.tsx` or a scenarios index).

- [ ] **Step 2: Add the new scenario entry**

Add a card/link for the new scenario following the existing pattern. The route path is `/jsv6-test-cases/advanced/vault-return-buyer`.

Example entry (following existing card patterns):
```tsx
<Link href="/jsv6-test-cases/advanced/vault-return-buyer"
  className="...existing card styles...">
  <CreditCard className="size-6" />
  <span>Return Buyer — Edit-FI & Instant</span>
</Link>
```

- [ ] **Step 3: Verify compilation**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test/code && npx tsc --noEmit --pretty 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add <modified-home-page>
git commit -m "feat: add vault-return-buyer scenario to navigation"
```

---

### Task 8: Final verification and manual test

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test/code && pnpm run dev
```

- [ ] **Step 2: Navigate to the scenario**

Open `http://localhost:<port>/jsv6-test-cases/advanced/vault-return-buyer`

- [ ] **Step 3: Verify manual flow**

1. Vault ID input should pre-fill if an active vault exists in D1
2. Click "Set" → SDK initializes with vault-scoped token
3. SPM container should load the saved payment method element
4. Click "Pay Now in One Click" → should complete instantly (or capture)
5. Click the SPM element → should open edit popup → approve → Execute Order appears → click → captured
6. Error cases: empty vault ID shows toast, failed init shows error

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: adjustments from manual testing"
```