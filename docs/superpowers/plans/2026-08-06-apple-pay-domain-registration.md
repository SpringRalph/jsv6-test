# Apple Pay Domain Register/Deregister Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Apple Pay domain register/query/deregister panel to the Apple Pay test-case page, working only in partner (三方) integration mode.

**Architecture:** One new Next.js API route (`app/api/paypal/apple-pay/domain-registration/route.ts`) exposes GET/POST/DELETE, proxying to PayPal's `v1/customer/wallet-domains` and `v1/customer/unregister-wallet-domain` REST endpoints using the existing OAuth-token + Basic-Auth + PayPal-Auth-Assertion pattern already used by other routes in this repo. One new client component (`components/panels/ApplePayDomainPanel.tsx`) renders the UI, gated on `useEnvStore().integrationMode`, and is inserted into the Apple Pay page below `CartSummary`.

**Tech Stack:** Next.js App Router (edge runtime), Zustand (`useEnvStore`), `react-hot-toast`, Tailwind CSS.

**Note on verification:** This repo has no test runner configured (no jest/vitest/playwright, no `test` script in `package.json`) — it's a manual/visual test-case app. Verification steps in this plan use `curl` against the dev server for the API route and manual browser checks for the UI, matching how the rest of this codebase is verified.

---

### Task 1: API route — GET (list) and partner-mode guard

**Files:**
- Create: `code/app/api/paypal/apple-pay/domain-registration/route.ts`

- [ ] **Step 1: Create the route file with the OAuth helper, the partner-mode guard, and the GET handler**

```typescript
import { buildBasicAuthHeader, buildPayPalRequestHeaders, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
import { NextResponse } from "next/server";
import consola from "consola";

export const runtime = 'edge';

async function getAccessToken(base: string, basic: string, req: Request): Promise<string> {
    const res = await fetch(`${base}/v1/oauth2/token`, {
        method: "POST",
        headers: buildPayPalRequestHeaders(req, basic, { "Content-Type": "application/x-www-form-urlencoded" }),
        body: "grant_type=client_credentials",
    });
    if (!res.ok) throw new Error(`Failed to get access token: ${res.status}`);
    const json = await res.json();
    return json.access_token;
}

function requirePartnerMode(req: Request): NextResponse | null {
    if (!req.headers.get("x-paypal-auth-assertion")) {
        return NextResponse.json(
            { error: "Apple Pay domain registration requires partner (three-party) integration mode" },
            { status: 400 }
        );
    }
    return null;
}

export async function GET(req: Request) {
    consola.info("[/api/paypal/apple-pay/domain-registration] HTTP GET received");
    const guardErr = requirePartnerMode(req);
    if (guardErr) return guardErr;

    try {
        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        const basic = buildBasicAuthHeader(clientId, clientSecret);
        const accessToken = await getAccessToken(base, basic, req);

        const res = await fetch(`${base}/v1/customer/wallet-domains`, {
            method: "GET",
            headers: buildPayPalRequestHeaders(req, `Bearer ${accessToken}`),
        });

        const text = await res.text();
        if (!res.ok) {
            let details: any = text;
            try { details = JSON.parse(text); } catch { }
            consola.error("PayPal wallet-domains list failed:", details);
            return NextResponse.json({ error: "failed to list domains", details }, { status: 502 });
        }

        const json = JSON.parse(text);
        return NextResponse.json({ domains: json.wallet_domains ?? [] });
    } catch (err: any) {
        consola.error("Apple Pay domain list error:", err);
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}
```

- [ ] **Step 2: Start the dev server and verify the partner-mode guard rejects requests without the auth-assertion header**

Run: `cd code && npm run dev` (leave running), then in another shell:
```bash
curl -s -X GET http://localhost:3000/api/paypal/apple-pay/domain-registration | python3 -m json.tool
```
Expected: `{"error": "Apple Pay domain registration requires partner (three-party) integration mode"}` with HTTP 400.

- [ ] **Step 3: Verify the GET handler reaches PayPal when given valid partner headers**

Get a real partner client id/secret and merchant id from `code/store/useEnvStore.ts` (`SANDBOX_CLIENT_ID_C2_PARTNER`, `SANDBOX_SECRET_ID_C2_PARTNER`, `SANDBOX_PARTNER_MERCHANT_ID_C2`). Build an auth-assertion value the same way `buildAuthAssertionHeader` does (base64 of `{"alg":"none"}` + `.` + base64 of `{"iss":"<clientId>","payer_id":"<merchantId>"}` + `.`), or simpler: open the app in the browser (see Task 3) and use the Network tab. For a quick manual curl check:
```bash
curl -s -X GET http://localhost:3000/api/paypal/apple-pay/domain-registration \
  -H "x-paypal-client-id: AePs-yrCXVsSOXgyI366Of0nlHm4siQdYBTKmQHSOwAaelbWFi836og7nc1y-gKZxROWTNFSV1l7oELW" \
  -H "x-paypal-secret: EAvQRspHg3Z5ID5q8u0NY5PmmXVHNJFpEQpqjIoqhUe5iwWQNnZTMpYDSP9LVz_TEwDn7midKulLkRZ4" \
  -H "x-paypal-env: sandbox" \
  -H "x-paypal-auth-assertion: eyJhbGciOiJub25lIn0=.eyJpc3MiOiJBZVBzLXlyQ1hWc1NPWGd5STM2Nk9mMG5sSG00c2lRZFlCVEttUW5TT3dBYWVsYldGaTgzNm9nN25jMXktZ0taeFJPV1RORlNWMWw3b0VMVyIsInBheWVyX2lkIjoiNllGTkc4SFo2QTdOSiJ9." \
  | python3 -m json.tool
```
Expected: `{"domains": [...]}` (likely an empty list on a fresh sandbox account) with HTTP 200 — confirms the OAuth + wallet-domains call chain works end-to-end.

- [ ] **Step 4: Commit**

```bash
git add code/app/api/paypal/apple-pay/domain-registration/route.ts
git commit -m "$(cat <<'EOF'
feat[2026-08-06](applePay): 新增 Apple Pay 域名查询接口

## 解决的问题
支持在页面内查询已注册的 Apple Pay wallet 域名，无需登录 PayPal 后台

## 主要改动
- code/app/api/paypal/apple-pay/domain-registration/route.ts: 新增 GET handler，代理调用 v1/customer/wallet-domains，非 partner 模式直接 400

## 为什么这么改
PayPal wallet-domains API 要求 PayPal-Auth-Assertion 头，只有三方(partner)模式下才会生成该头，因此在路由层加前置校验
EOF
)"
```

---

### Task 2: API route — POST (register) and DELETE (deregister)

**Files:**
- Modify: `code/app/api/paypal/apple-pay/domain-registration/route.ts`

- [ ] **Step 1: Add the POST handler (register) below the existing GET handler**

```typescript
export async function POST(req: Request) {
    consola.info("[/api/paypal/apple-pay/domain-registration] HTTP POST received");
    const guardErr = requirePartnerMode(req);
    if (guardErr) return guardErr;

    try {
        const body = await req.json().catch(() => null);
        const domain: string = body?.domain;
        if (!domain) {
            return NextResponse.json({ error: "domain is required" }, { status: 400 });
        }

        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        const basic = buildBasicAuthHeader(clientId, clientSecret);
        const accessToken = await getAccessToken(base, basic, req);

        const res = await fetch(`${base}/v1/customer/wallet-domains`, {
            method: "POST",
            headers: buildPayPalRequestHeaders(req, `Bearer ${accessToken}`),
            body: JSON.stringify({
                provider_type: "APPLE_PAY",
                domain: { name: domain },
            }),
        });

        const text = await res.text();
        if (!res.ok) {
            let details: any = text;
            try { details = JSON.parse(text); } catch { }
            consola.error("PayPal wallet-domains register failed:", details);
            return NextResponse.json({ error: "failed to register domain", details }, { status: 502 });
        }

        const json = text ? JSON.parse(text) : {};
        return NextResponse.json(json);
    } catch (err: any) {
        consola.error("Apple Pay domain register error:", err);
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}
```

- [ ] **Step 2: Add the DELETE handler (deregister) below the POST handler**

```typescript
export async function DELETE(req: Request) {
    consola.info("[/api/paypal/apple-pay/domain-registration] HTTP DELETE received");
    const guardErr = requirePartnerMode(req);
    if (guardErr) return guardErr;

    try {
        const body = await req.json().catch(() => null);
        const domain: string = body?.domain;
        if (!domain) {
            return NextResponse.json({ error: "domain is required" }, { status: 400 });
        }
        const reason: string = body?.reason || "Merchant requested to deregister domain";

        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        const basic = buildBasicAuthHeader(clientId, clientSecret);
        const accessToken = await getAccessToken(base, basic, req);

        const res = await fetch(`${base}/v1/customer/unregister-wallet-domain`, {
            method: "POST",
            headers: buildPayPalRequestHeaders(req, `Bearer ${accessToken}`),
            body: JSON.stringify({
                provider_type: "APPLE_PAY",
                domain: { name: domain },
                reason,
            }),
        });

        const text = await res.text();
        if (!res.ok) {
            let details: any = text;
            try { details = JSON.parse(text); } catch { }
            consola.error("PayPal wallet-domains deregister failed:", details);
            return NextResponse.json({ error: "failed to deregister domain", details }, { status: 502 });
        }

        const json = text ? JSON.parse(text) : {};
        return NextResponse.json(json);
    } catch (err: any) {
        consola.error("Apple Pay domain deregister error:", err);
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}
```

- [ ] **Step 3: Verify POST is guarded the same way as GET**

Run (dev server still up from Task 1):
```bash
curl -s -X POST http://localhost:3000/api/paypal/apple-pay/domain-registration -d '{"domain":"example.com"}' | python3 -m json.tool
```
Expected: 400 with the partner-mode error message (no `x-paypal-auth-assertion` header sent).

- [ ] **Step 4: Verify POST validates the domain field when partner headers are present**

```bash
curl -s -X POST http://localhost:3000/api/paypal/apple-pay/domain-registration \
  -H "x-paypal-client-id: AePs-yrCXVsSOXgyI366Of0nlHm4siQdYBTKmQHSOwAaelbWFi836og7nc1y-gKZxROWTNFSV1l7oELW" \
  -H "x-paypal-secret: EAvQRspHg3Z5ID5q8u0NY5PmmXVHNJFpEQpqjIoqhUe5iwWQNnZTMpYDSP9LVz_TEwDn7midKulLkRZ4" \
  -H "x-paypal-env: sandbox" \
  -H "x-paypal-auth-assertion: eyJhbGciOiJub25lIn0=.eyJpc3MiOiJBZVBzLXlyQ1hWc1NPWGd5STM2Nk9mMG5sSG00c2lRZFlCVEttUW5TT3dBYWVsYldGaTgzNm9nN25jMXktZ0taeFJPV1RORlNWMWw3b0VMVyIsInBheWVyX2lkIjoiNllGTkc4SFo2QTdOSiJ9." \
  -d '{}' | python3 -m json.tool
```
Expected: `{"error": "domain is required"}` with HTTP 400.

- [ ] **Step 5: Commit**

```bash
git add code/app/api/paypal/apple-pay/domain-registration/route.ts
git commit -m "$(cat <<'EOF'
feat[2026-08-06](applePay): 新增 Apple Pay 域名注册/解绑接口

## 解决的问题
支持在页面内注册和解绑 Apple Pay wallet 域名，无需登录 PayPal 后台

## 主要改动
- code/app/api/paypal/apple-pay/domain-registration/route.ts: 新增 POST(注册) 和 DELETE(解绑) handler，均代理调用 PayPal v1/customer/wallet-domains 与 v1/customer/unregister-wallet-domain

## 为什么这么改
两者与查询接口共用相同的 OAuth token 获取和 partner 模式校验逻辑，放在同一路由文件里保持内聚
EOF
)"
```

---

### Task 3: Client panel component

**Files:**
- Create: `code/components/panels/ApplePayDomainPanel.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Card } from "@/components/ui/Card"
import { useEnvStore } from "@/store/useEnvStore"
import { getPayPalHeaders } from "@/services/paypal-sdk-function/paypal-headers"

export function ApplePayDomainPanel() {
  const integrationMode = useEnvStore((s) => s.integrationMode)
  const isPartnerMode = integrationMode === "partner"

  const [domain, setDomain] = useState("")
  const [domains, setDomains] = useState<string[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [deregisteringDomain, setDeregisteringDomain] = useState<string | null>(null)
  const [reasonByDomain, setReasonByDomain] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDomain(window.location.hostname)
    }
  }, [])

  const fetchDomains = async () => {
    if (!isPartnerMode) return
    setLoadingList(true)
    try {
      const res = await fetch("/api/paypal/apple-pay/domain-registration", {
        headers: getPayPalHeaders(),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to list domains")
        return
      }
      const names: string[] = (data.domains ?? []).map((d: any) => d?.name ?? d).filter(Boolean)
      setDomains(names)
    } catch (err: any) {
      toast.error(`Failed to list domains: ${String(err)}`)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    if (isPartnerMode) {
      fetchDomains()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartnerMode])

  const registerDomain = async () => {
    if (!domain) return
    setRegistering(true)
    try {
      const res = await fetch("/api/paypal/apple-pay/domain-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getPayPalHeaders() },
        body: JSON.stringify({ domain }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to register domain")
        return
      }
      toast.success(`已注册域名: ${domain}`)
      fetchDomains()
    } catch (err: any) {
      toast.error(`Failed to register domain: ${String(err)}`)
    } finally {
      setRegistering(false)
    }
  }

  const deregisterDomain = async (name: string) => {
    setDeregisteringDomain(name)
    try {
      const res = await fetch("/api/paypal/apple-pay/domain-registration", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getPayPalHeaders() },
        body: JSON.stringify({ domain: name, reason: reasonByDomain[name] || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to deregister domain")
        return
      }
      toast.success(`已解绑域名: ${name}`)
      fetchDomains()
    } catch (err: any) {
      toast.error(`Failed to deregister domain: ${String(err)}`)
    } finally {
      setDeregisteringDomain(null)
    }
  }

  return (
    <Card className="p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 -z-10" />

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">🍎</span>
        Apple Pay Domain
      </h2>

      {!isPartnerMode && (
        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          域名注册/解绑仅在三方模式（Partner）下可用，请在 EnvPanel 中切换 Integration Mode。
        </p>
      )}

      <fieldset disabled={!isPartnerMode} className={!isPartnerMode ? "opacity-50 pointer-events-none" : undefined}>
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="flex-1 border rounded-lg px-3 py-2 bg-background"
          />
          <button
            onClick={registerDomain}
            disabled={registering || !domain}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {registering ? "注册中..." : "注册域名"}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">已注册域名</h3>
            <button onClick={fetchDomains} className="text-xs text-blue-600 hover:underline">
              {loadingList ? "刷新中..." : "刷新"}
            </button>
          </div>

          {domains.length === 0 && !loadingList && (
            <p className="text-sm text-muted-foreground">暂无已注册域名</p>
          )}

          {domains.map((name) => (
            <div key={name} className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
              <span className="flex-1 font-mono text-sm">{name}</span>
              <input
                type="text"
                value={reasonByDomain[name] ?? ""}
                onChange={(e) => setReasonByDomain((prev) => ({ ...prev, [name]: e.target.value }))}
                placeholder="解绑原因（可选）"
                className="w-48 border rounded-lg px-2 py-1 text-sm bg-background"
              />
              <button
                onClick={() => deregisterDomain(name)}
                disabled={deregisteringDomain === name}
                className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-50"
              >
                {deregisteringDomain === name ? "解绑中..." : "解绑"}
              </button>
            </div>
          ))}
        </div>
      </fieldset>
    </Card>
  )
}
```

- [ ] **Step 2: Confirm `Card`, `useEnvStore`, and `getPayPalHeaders` import paths resolve**

Run: `cd code && npx tsc --noEmit`
Expected: no new errors referencing `ApplePayDomainPanel.tsx` (pre-existing unrelated errors, if any, are out of scope).

- [ ] **Step 3: Commit**

```bash
git add code/components/panels/ApplePayDomainPanel.tsx
git commit -m "$(cat <<'EOF'
feat[2026-08-06](applePay): 新增 Apple Pay 域名管理面板组件

## 解决的问题
在页面内提供域名注册、查询、解绑的可视化操作入口，一方模式下置灰并提示

## 主要改动
- code/components/panels/ApplePayDomainPanel.tsx: 新增客户端组件，读取 integrationMode 判断三方/一方模式，调用新增的 domain-registration 接口

## 为什么这么改
复用 getPayPalHeaders() 统一处理请求头，样式与页面其它卡片（CartSummary 等）保持一致的视觉语言
EOF
)"
```

---

### Task 4: Wire the panel into the Apple Pay page

**Files:**
- Modify: `code/app/jsv6-test-cases/advanced/applePay/page.tsx:1-43`

- [ ] **Step 1: Import the new component**

In `code/app/jsv6-test-cases/advanced/applePay/page.tsx`, change line 3-4 from:
```tsx
import { CartSummary } from "@/components/panels/CartSummary";
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
```
to:
```tsx
import { CartSummary } from "@/components/panels/CartSummary";
import { ApplePayDomainPanel } from "@/components/panels/ApplePayDomainPanel";
import { PaymentPlaceholder } from "@/components/panels/PaymentPlaceholder";
```

- [ ] **Step 2: Render the panel below CartSummary**

Change line 40-43 from:
```tsx
                    <div className="space-y-6">
                        <ProductPanel />
                        <CartSummary />
                    </div>
```
to:
```tsx
                    <div className="space-y-6">
                        <ProductPanel />
                        <CartSummary />
                        <ApplePayDomainPanel />
                    </div>
```

- [ ] **Step 3: Manually verify in the browser**

Run: `cd code && npm run dev` (if not already running from Task 1), then open `http://localhost:3000/jsv6-test-cases/advanced/applePay`.

Check:
1. With Integration Mode set to `merchant` (default) in EnvPanel: the new "Apple Pay Domain" card renders below Cart Summary, greyed out, showing the "仅三方模式..." message, input/buttons disabled.
2. Switch Integration Mode to `partner` in EnvPanel: the card becomes interactive, the domain input pre-fills with `localhost`, clicking "刷新" lists any existing registered domains (likely empty on a fresh sandbox account), and toasts render on success/error.
3. Type a real HTTPS test domain (not `localhost`, since PayPal will likely reject non-resolvable domains — any placeholder string is fine for verifying the request round-trip) and click "注册域名" — confirm a toast appears (success or a PayPal-side validation error is both acceptable, since the goal here is confirming wiring, not sandbox domain ownership).

- [ ] **Step 4: Commit**

```bash
git add code/app/jsv6-test-cases/advanced/applePay/page.tsx
git commit -m "$(cat <<'EOF'
feat[2026-08-06](applePay): 在 Apple Pay 测试页接入域名管理面板

## 解决的问题
将新增的域名注册/解绑面板展示在 Apple Pay 测试用例页面中，紧跟 Cart Summary 之后

## 主要改动
- code/app/jsv6-test-cases/advanced/applePay/page.tsx: 引入并渲染 ApplePayDomainPanel

## 为什么这么改
放在同一个左列 space-y-6 容器内，与 ProductPanel / CartSummary 保持一致的布局节奏
EOF
)"
```

---

## Plan Self-Review Notes

- **Spec coverage:** GET/POST/DELETE routes (Tasks 1-2) ✓, partner-mode gating both server-side (guard) and client-side (disabled fieldset) ✓, domain input pre-filled with hostname (Task 3 Step 1) ✓, list of registered domains (Task 3) ✓, optional reason field defaulting server-side (Task 2 Step 2, Task 3) ✓, page wiring below CartSummary (Task 4) ✓, styling consistent with existing cards (Task 3, blue theme) ✓.
- **Out of scope confirmed absent from plan:** `.well-known` file hosting, batch operations, persisted history — none appear in any task.
- **Type consistency:** `domain: string` and `reason?: string` request bodies match between client (`ApplePayDomainPanel.tsx`) and server (`route.ts`) across all three verbs. `getPayPalHeaders()` used identically to existing components (`ButtonSubscription.tsx` pattern).
