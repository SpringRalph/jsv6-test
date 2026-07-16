# 3rd Party (Partner) Integration Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "三方 Partner" integration mode to the SDK config panel, storing partner credentials + an authorized merchant id, and have every PayPal-facing API route attach a `PayPal-Auth-Assertion` header (computed from partner client id + merchant id) when that mode is active.

**Architecture:** Extend the existing Zustand `useEnvStore` with partner credential fields (mirroring the existing sandbox/live merchant credential pattern) and an `integrationMode` flag. The browser computes the Auth-Assertion value and sends it as a new `x-paypal-auth-assertion` request header (alongside the existing `x-paypal-client-id/secret/env` headers already sent by `getPayPalHeaders()`). A new shared server helper `buildPayPalRequestHeaders()` reads that header and forwards it as `PayPal-Auth-Assertion` to PayPal's REST API — wired into every route that calls PayPal on behalf of a merchant (order create/capture/get, vault, subscription).

**Tech Stack:** Next.js 16 (edge runtime API routes), Zustand (state + persist), React, Tailwind. No test framework exists in this repo (no jest/vitest configured, no existing test files) — verification here uses `npx tsc --noEmit` after each code change plus manual dev-server verification (curl + browser click-through), consistent with how the rest of this project is verified.

---

## Task 1: Extend `EnvState` type with partner/integration-mode fields

**Files:**
- Modify: `types/env.ts`

- [ ] **Step 1: Replace the file contents**

Current content:
```ts
export type PayPalEnv = "sandbox" | "live"
export type AuthMode = "clientToken" | "clientId"

export interface EnvState {
  env: PayPalEnv
  authMode: AuthMode
  // sandbox credentials
  clientId: string
  secret: string
  // live credentials
  liveClientId: string
  liveSecret: string
}
```

New content:
```ts
export type PayPalEnv = "sandbox" | "live"
export type AuthMode = "clientToken" | "clientId"
export type IntegrationMode = "merchant" | "partner"

export interface EnvState {
  env: PayPalEnv
  authMode: AuthMode
  integrationMode: IntegrationMode
  // sandbox credentials (1st party / merchant)
  clientId: string
  secret: string
  // live credentials (1st party / merchant)
  liveClientId: string
  liveSecret: string
  // sandbox partner credentials (3rd party)
  partnerClientId: string
  partnerSecret: string
  // live partner credentials (3rd party)
  livePartnerClientId: string
  livePartnerSecret: string
  // authorized merchant id used as payer_id in PayPal-Auth-Assertion
  authAssertionMerchantId: string
  liveAuthAssertionMerchantId: string
}
```

- [ ] **Step 2: Type-check (expect errors — consumers not updated yet)**

Run: `npx tsc --noEmit`
Expected: errors in `store/useEnvStore.ts` (missing new fields on `envDefaults`) — this is expected, Task 2 fixes it.

- [ ] **Step 3: Commit is deferred to end of Task 2** (these two files must land together to keep the build green)

---

## Task 2: Extend `useEnvStore` with partner state, setters, and active-credential logic

**Files:**
- Modify: `store/useEnvStore.ts`

- [ ] **Step 1: Replace the file contents**

New content:
```ts
'use client';

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { EnvState, PayPalEnv, AuthMode, IntegrationMode } from "@/types/env"

interface EnvStore extends EnvState {
  setEnv: (env: PayPalEnv) => void
  setAuthMode: (mode: AuthMode) => void
  setIntegrationMode: (mode: IntegrationMode) => void
  setClientId: (clientId: string) => void
  setSecret: (secret: string) => void
  setLiveClientId: (clientId: string) => void
  setLiveSecret: (secret: string) => void
  setPartnerClientId: (clientId: string) => void
  setPartnerSecret: (secret: string) => void
  setLivePartnerClientId: (clientId: string) => void
  setLivePartnerSecret: (secret: string) => void
  setAuthAssertionMerchantId: (merchantId: string) => void
  setLiveAuthAssertionMerchantId: (merchantId: string) => void
  reset: () => void
  // returns active credentials based on current env + integration mode
  activeClientId: () => string
  activeSecret: () => string
  activeAuthAssertionMerchantId: () => string
  sdkReloadToken: number
  bumpSdkReloadToken: () => void
}

export const LIVE_CLIENT_ID_C2 = "AZXvmryZOBQvyeBosxJoMsNbNCYVNGWx5KyArJPYz2O2sEGAOla9s6cI40RVFXHg9oEInNzyQIKzI6tW"
export const LIVE_SECRET_C2 = "EAx19qrwczQSJeSzQ5FjlzAUAjgd7LJcneDH9k93ZocGWaF4k_oYcX1k8-AvSrJkMvdlncdIUYZSxtf0"


/**
 * Application Name: C2-JSv6 Test APP
 * Email Id: p-test-cn-v6-2025@test.com
 * Account Number: 5314333912581353572
 * pwd: Qq111222333
 */

export const SANDBOX_CLIENT_ID_C2 = "ATW2maVlMXBh67xRprsLYttNFXVCDO7MhEUE_VId1zbwqSSfYfIAC8mtdLaLRwA4nZpTzGBZPws7Kf-Z";
export const SANDBOX_SECRET_ID_C2 = "ELYFWy2PauSftn1lFaTkqsUd2sDu_gPrOi3cGOGj_6JyORnlG46cp16oBnLLmpBBQuhxQIKIiOIwCu_D";


const envDefaults: EnvState = {
  env: "sandbox",
  authMode: "clientToken",
  integrationMode: "merchant",
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
  secret: process.env.NEXT_PUBLIC_PAYPAL_SECRET ?? "",
  liveClientId: LIVE_CLIENT_ID_C2,
  liveSecret: LIVE_SECRET_C2,
  partnerClientId: "",
  partnerSecret: "",
  livePartnerClientId: "",
  livePartnerSecret: "",
  authAssertionMerchantId: "",
  liveAuthAssertionMerchantId: "",
}

export const useEnvStore = create<EnvStore>()(
  persist(
    (set, get) => ({
      ...envDefaults,
      setEnv: (env) => set({ env }),
      setAuthMode: (authMode) => set({ authMode }),
      setIntegrationMode: (integrationMode) => set({ integrationMode }),
      setClientId: (clientId) => set({ clientId }),
      setSecret: (secret) => set({ secret }),
      setLiveClientId: (liveClientId) => set({ liveClientId }),
      setLiveSecret: (liveSecret) => set({ liveSecret }),
      setPartnerClientId: (partnerClientId) => set({ partnerClientId }),
      setPartnerSecret: (partnerSecret) => set({ partnerSecret }),
      setLivePartnerClientId: (livePartnerClientId) => set({ livePartnerClientId }),
      setLivePartnerSecret: (livePartnerSecret) => set({ livePartnerSecret }),
      setAuthAssertionMerchantId: (authAssertionMerchantId) => set({ authAssertionMerchantId }),
      setLiveAuthAssertionMerchantId: (liveAuthAssertionMerchantId) => set({ liveAuthAssertionMerchantId }),
      reset: () => set(envDefaults),
      activeClientId: () => {
        const s = get()
        if (s.integrationMode === "partner") {
          return s.env === "live" ? s.livePartnerClientId : s.partnerClientId
        }
        return s.env === "live" ? s.liveClientId : s.clientId
      },
      activeSecret: () => {
        const s = get()
        if (s.integrationMode === "partner") {
          return s.env === "live" ? s.livePartnerSecret : s.partnerSecret
        }
        return s.env === "live" ? s.liveSecret : s.secret
      },
      activeAuthAssertionMerchantId: () => {
        const s = get()
        return s.env === "live" ? s.liveAuthAssertionMerchantId : s.authAssertionMerchantId
      },
      sdkReloadToken: 0,
      bumpSdkReloadToken: () => set((s) => ({ sdkReloadToken: s.sdkReloadToken + 1 })),
    }),
    {
      name: "pp-v6-env",
    },
  ),
)
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors related to `types/env.ts` or `store/useEnvStore.ts`.

- [ ] **Step 3: Commit**

```bash
git add types/env.ts store/useEnvStore.ts
git commit -m "$(cat <<'EOF'
feat[2026-07-16]: useEnvStore 支持三方 Partner 集成模式

## 解决的问题
现有 useEnvStore 只支持一方 merchant 凭据，无法表达三方 partner 场景（partner 凭据 + 授权 merchant id）。

## 主要改动
- types/env.ts: 新增 IntegrationMode 类型及 partner/authAssertionMerchantId 相关字段
- store/useEnvStore.ts: 新增对应 state/setter，activeClientId()/activeSecret() 按 integrationMode 选择一方或三方凭据，新增 activeAuthAssertionMerchantId()

## 为什么这么改
复用现有 sandbox/live 分离 + active getter 的模式，让下游消费方（SDK init、请求 header 构造）自动感知三方凭据，无需改动它们的核心逻辑。
EOF
)"
```

---

## Task 3: Add Auth-Assertion header value builder

**Files:**
- Create: `services/paypal-sdk-function/auth-assertion.ts`

- [ ] **Step 1: Write the file**

```ts
/**
 * Builds the PayPal-Auth-Assertion header value: an unsigned "JWT" of
 * base64({"alg":"none"}).base64({"iss":clientId,"payer_id":merchantId}).
 */
export function buildAuthAssertionHeader(clientId: string, merchantId: string): string {
    const header = "eyJhbGciOiJub25lIn0="; // base64({"alg":"none"})
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ iss: clientId, payer_id: merchantId }))));
    return `${header}.${payload}.`;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add services/paypal-sdk-function/auth-assertion.ts
git commit -m "$(cat <<'EOF'
feat[2026-07-16]: 新增 PayPal-Auth-Assertion 头值构造函数

## 解决的问题
三方 Partner 模式下下单/capture 需要带 PayPal-Auth-Assertion 头声明代表哪个下游商户操作，目前项目里没有生成该值的工具函数。

## 主要改动
- services/paypal-sdk-function/auth-assertion.ts: buildAuthAssertionHeader(clientId, merchantId) 生成无签名 JWT 格式的 header 值

## 为什么这么改
在浏览器端一次性算好这个值再通过请求头透传给后端 route，后端只需要转发，不用每个 route 重复实现同样的 base64/JSON 拼接逻辑。
EOF
)"
```

---

## Task 4: Attach Auth-Assertion header to outgoing requests from the browser

**Files:**
- Modify: `services/paypal-sdk-function/paypal-headers.ts`

- [ ] **Step 1: Replace the file contents**

Current content:
```ts
"use client";

import { useEnvStore } from "@/store/useEnvStore";

/** Returns x-paypal-* headers based on the current store env/credentials. */
export function getPayPalHeaders(): Record<string, string> {
    const store = useEnvStore.getState();
    return {
        "x-paypal-client-id": store.activeClientId(),
        "x-paypal-secret": store.activeSecret(),
        "x-paypal-env": store.env,
    };
}
```

New content:
```ts
"use client";

import { useEnvStore } from "@/store/useEnvStore";
import { buildAuthAssertionHeader } from "@/services/paypal-sdk-function/auth-assertion";

/** Returns x-paypal-* headers based on the current store env/credentials. */
export function getPayPalHeaders(): Record<string, string> {
    const store = useEnvStore.getState();
    const headers: Record<string, string> = {
        "x-paypal-client-id": store.activeClientId(),
        "x-paypal-secret": store.activeSecret(),
        "x-paypal-env": store.env,
    };

    if (store.integrationMode === "partner") {
        const merchantId = store.activeAuthAssertionMerchantId();
        if (merchantId) {
            headers["x-paypal-auth-assertion"] = buildAuthAssertionHeader(store.activeClientId(), merchantId);
        }
    }

    return headers;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add services/paypal-sdk-function/paypal-headers.ts
git commit -m "$(cat <<'EOF'
feat[2026-07-16]: getPayPalHeaders 在三方模式下附加 x-paypal-auth-assertion

## 解决的问题
浏览器端发往后端 API route 的请求头目前不携带 Auth-Assertion 信息，三方模式下后端无法转发这个头给 PayPal。

## 主要改动
- services/paypal-sdk-function/paypal-headers.ts: integrationMode 为 partner 且已填 merchant id 时，附加 x-paypal-auth-assertion 头

## 为什么这么改
getPayPalHeaders() 是所有下单/capture/vault 请求唯一的 header 构造入口，改这一处即可让 38+ 个调用方自动获得 Auth-Assertion 能力，不用逐个组件改造。
EOF
)"
```

---

## Task 5: Add shared server-side header-forwarding helper

**Files:**
- Modify: `services/paypal-server-side-function/server-function.ts`

- [ ] **Step 1: Add `buildPayPalRequestHeaders` to the end of the file**

Current end of file:
```ts
export function getPayPalConfigFromRequest(req: Request) {
    const h = req.headers;
    const overrideClientId = h.get("x-paypal-client-id") || undefined;
    const overrideSecret = h.get("x-paypal-secret") || undefined;
    const overrideEnvRaw = h.get("x-paypal-env") || undefined;
    const overrideEnv = overrideEnvRaw === "live" ? "production" : overrideEnvRaw;
    return getPayPalConfig({ clientId: overrideClientId, clientSecret: overrideSecret, env: overrideEnv });
}
```

New end of file (append after the block above):
```ts
export function getPayPalConfigFromRequest(req: Request) {
    const h = req.headers;
    const overrideClientId = h.get("x-paypal-client-id") || undefined;
    const overrideSecret = h.get("x-paypal-secret") || undefined;
    const overrideEnvRaw = h.get("x-paypal-env") || undefined;
    const overrideEnv = overrideEnvRaw === "live" ? "production" : overrideEnvRaw;
    return getPayPalConfig({ clientId: overrideClientId, clientSecret: overrideSecret, env: overrideEnv });
}

/**
 * Builds headers for an outbound PayPal API call, forwarding the
 * PayPal-Auth-Assertion value (if the browser sent one via
 * x-paypal-auth-assertion) so 3rd-party/partner requests carry it.
 */
export function buildPayPalRequestHeaders(req: Request, authorization: string, extra?: Record<string, string>) {
    const headers: Record<string, string> = { Authorization: authorization, "Content-Type": "application/json", ...extra };
    const authAssertion = req.headers.get("x-paypal-auth-assertion");
    if (authAssertion) headers["PayPal-Auth-Assertion"] = authAssertion;
    return headers;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add services/paypal-server-side-function/server-function.ts
git commit -m "$(cat <<'EOF'
feat[2026-07-16]: 新增 buildPayPalRequestHeaders 转发 Auth-Assertion 头

## 解决的问题
16 个调用 PayPal REST API 的 route.ts 各自手写 headers 对象，如果每处都单独加 PayPal-Auth-Assertion 转发逻辑容易遗漏或写法不一致。

## 主要改动
- services/paypal-server-side-function/server-function.ts: 新增 buildPayPalRequestHeaders(req, authorization, extra?)，统一读取 x-paypal-auth-assertion 并转发为 PayPal-Auth-Assertion

## 为什么这么改
把"是否转发 Auth-Assertion"这件事收敛到一个函数里，后续每个 route 只需要把手写的 headers 对象换成这一个调用。
EOF
)"
```

---

## Task 6: Wire the header helper into the 10 standard create-order route variants

These 10 files share the identical pattern: `Authorization: basic, "Content-Type": "application/json"` with no extra headers, called via `POST(req: Request)`.

**Files (all get the same two edits — import line + headers block):**
- Modify: `app/api/paypal/order/create/create-order/route.ts`
- Modify: `app/api/paypal/order/create/create-order-ACDC/route.ts`
- Modify: `app/api/paypal/order/create/create-order-ACDC-With-3DS/route.ts`
- Modify: `app/api/paypal/order/create/create-order-bcdc/route.ts`
- Modify: `app/api/paypal/order/create/create-order-bcdc-with-more-info/route.ts`
- Modify: `app/api/paypal/order/create/create-order-bcdc-with-more-info-with-email/route.ts`
- Modify: `app/api/paypal/order/create/create-order-EUR/route.ts`
- Modify: `app/api/paypal/order/create/create-order-PLN/route.ts`
- Modify: `app/api/paypal/order/create/create-order-redirect/route.ts`
- Modify: `app/api/paypal/order/create/create-order-paypal-one-time-payment-with-vault/route.ts`

- [ ] **Step 1: For EACH of the 10 files above, update the import line**

Before (exact text in every one of these files):
```ts
import { buildBasicAuthHeader, getPayPalConfig, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
```

After:
```ts
import { buildBasicAuthHeader, buildPayPalRequestHeaders, getPayPalConfig, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
```

Note: `create-order-ACDC-With-3DS/route.ts` calls `getPayPalConfig()` (no `req` arg) instead of `getPayPalConfigFromRequest(req)` for building credentials — that's a pre-existing inconsistency, out of scope to fix here. It still has `req: Request` in scope for `buildPayPalRequestHeaders(req, basic)` since the POST handler signature is `POST(req: Request)`.

- [ ] **Step 2: For EACH of the 10 files, update the headers block inside the `fetch` call**

Before (exact text in every one of these files):
```ts
        const createRes = await fetch(`${base}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                Authorization: basic,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderBody),
        });
```

After:
```ts
        const createRes = await fetch(`${base}/v2/checkout/orders`, {
            method: "POST",
            headers: buildPayPalRequestHeaders(req, basic),
            body: JSON.stringify(orderBody),
        });
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/paypal/order/create/create-order/route.ts \
        app/api/paypal/order/create/create-order-ACDC/route.ts \
        app/api/paypal/order/create/create-order-ACDC-With-3DS/route.ts \
        app/api/paypal/order/create/create-order-bcdc/route.ts \
        app/api/paypal/order/create/create-order-bcdc-with-more-info/route.ts \
        app/api/paypal/order/create/create-order-bcdc-with-more-info-with-email/route.ts \
        app/api/paypal/order/create/create-order-EUR/route.ts \
        app/api/paypal/order/create/create-order-PLN/route.ts \
        app/api/paypal/order/create/create-order-redirect/route.ts \
        app/api/paypal/order/create/create-order-paypal-one-time-payment-with-vault/route.ts
git commit -m "$(cat <<'EOF'
feat[2026-07-16]: 10 个 create-order 变体转发 PayPal-Auth-Assertion 头

## 解决的问题
三方 Partner 模式下这些创建订单的接口需要把 Auth-Assertion 头透传给 PayPal，此前 headers 是手写的固定对象。

## 主要改动
- 上述 10 个 route.ts: headers 从手写对象改为 buildPayPalRequestHeaders(req, basic)

## 为什么这么改
这 10 个文件的 header 构造完全一致，统一换成共享 helper，避免每个文件重复维护 Auth-Assertion 转发逻辑。
EOF
)"
```

---

## Task 7: Wire the header helper into `create-order-paypal-with-vault-id` (has an extra header)

**Files:**
- Modify: `app/api/paypal/order/create/create-order-paypal-with-vault-id/route.ts`

- [ ] **Step 1: Update the import line**

Before:
```ts
import { buildBasicAuthHeader, getPayPalConfig, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
```

After:
```ts
import { buildBasicAuthHeader, buildPayPalRequestHeaders, getPayPalConfig, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
```

- [ ] **Step 2: Update the headers block (keeps the existing `PayPal-Request-Id` header)**

Before:
```ts
        const createRes = await fetch(`${base}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                Authorization: basic,
                "Content-Type": "application/json",
                "PayPal-Request-Id": generate32CharId(),
            },
            body: JSON.stringify(orderBody),
        });
```

After:
```ts
        const createRes = await fetch(`${base}/v2/checkout/orders`, {
            method: "POST",
            headers: buildPayPalRequestHeaders(req, basic, { "PayPal-Request-Id": generate32CharId() }),
            body: JSON.stringify(orderBody),
        });
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/paypal/order/create/create-order-paypal-with-vault-id/route.ts
git commit -m "$(cat <<'EOF'
feat[2026-07-16]: create-order-paypal-with-vault-id 转发 PayPal-Auth-Assertion 头

## 主要改动
- app/api/paypal/order/create/create-order-paypal-with-vault-id/route.ts: headers 改用 buildPayPalRequestHeaders(req, basic, { "PayPal-Request-Id": ... })，保留原有的 PayPal-Request-Id
EOF
)"
```

---

## Task 8: Wire the header helper into `capture-order`

**Files:**
- Modify: `app/api/paypal/order/capture/capture-order/route.ts`

- [ ] **Step 1: Update the import line**

Before:
```ts
import { buildBasicAuthHeader, getPayPalConfig, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
```

After:
```ts
import { buildBasicAuthHeader, buildPayPalRequestHeaders, getPayPalConfig, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
```

- [ ] **Step 2: Update the headers block (keeps the existing `Accept` header)**

Before:
```ts
		const captureRes = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
			method: "POST",
			headers: {
				Authorization: basic,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			// PayPal 接口允许空 body；留空或传 {} 均可
			body: JSON.stringify({}),
		});
```

After:
```ts
		const captureRes = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
			method: "POST",
			headers: buildPayPalRequestHeaders(req, basic, { Accept: "application/json" }),
			// PayPal 接口允许空 body；留空或传 {} 均可
			body: JSON.stringify({}),
		});
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/paypal/order/capture/capture-order/route.ts
git commit -m "$(cat <<'EOF'
feat[2026-07-16]: capture-order 转发 PayPal-Auth-Assertion 头

## 主要改动
- app/api/paypal/order/capture/capture-order/route.ts: headers 改用 buildPayPalRequestHeaders(req, basic, { Accept: "application/json" })
EOF
)"
```

---

## Task 9: Wire the header helper into `get-order`

**Files:**
- Modify: `app/api/paypal/order/get/get-order/route.ts`

- [ ] **Step 1: Update the import block**

Before:
```ts
import {
    buildBasicAuthHeader,
    getPayPalConfigFromRequest,
} from "@/services/paypal-server-side-function/server-function";
```

After:
```ts
import {
    buildBasicAuthHeader,
    buildPayPalRequestHeaders,
    getPayPalConfigFromRequest,
} from "@/services/paypal-server-side-function/server-function";
```

- [ ] **Step 2: Update the headers block (GET request, keeps `Accept` header)**

Before:
```ts
        const getRes = await fetch(
            `${base}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
            {
                method: "GET",
                headers: {
                    Authorization: basic,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            },
        );
```

After:
```ts
        const getRes = await fetch(
            `${base}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
            {
                method: "GET",
                headers: buildPayPalRequestHeaders(req, basic, { Accept: "application/json" }),
            },
        );
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/api/paypal/order/get/get-order/route.ts
git commit -m "$(cat <<'EOF'
feat[2026-07-16]: get-order 转发 PayPal-Auth-Assertion 头

## 主要改动
- app/api/paypal/order/get/get-order/route.ts: headers 改用 buildPayPalRequestHeaders(req, basic, { Accept: "application/json" })
EOF
)"
```

---

## Task 10: Wire the header helper into vault routes

**Files:**
- Modify: `app/api/paypal/vault/create-setup-token-for-paypal-save-payment/route.ts`
- Modify: `app/api/paypal/vault/payment-token/create/route.ts`

- [ ] **Step 1: In `create-setup-token-for-paypal-save-payment/route.ts`, update the import line**

Before:
```ts
import { buildBasicAuthHeader, getPayPalConfig, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
```

After:
```ts
import { buildBasicAuthHeader, buildPayPalRequestHeaders, getPayPalConfig, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
```

Note: this route's handler is `export async function GET(req: Request)` — `req` is already in scope.

- [ ] **Step 2: In the same file, update the headers block**

Before:
```ts
        const setupRes = await fetch(`${base}/v3/vault/setup-tokens`, {
            method: "POST",
            headers: {
                Authorization: basic,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
```

After:
```ts
        const setupRes = await fetch(`${base}/v3/vault/setup-tokens`, {
            method: "POST",
            headers: buildPayPalRequestHeaders(req, basic),
            body: JSON.stringify(payload),
        });
```

- [ ] **Step 3: In `payment-token/create/route.ts`, update the import line**

Before:
```ts
import { buildBasicAuthHeader, getPayPalConfig, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
```

After:
```ts
import { buildBasicAuthHeader, buildPayPalRequestHeaders, getPayPalConfig, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
```

- [ ] **Step 4: In the same file, update the headers block**

Before:
```ts
        const res = await fetch(`${base}/v3/vault/payment-tokens`, {
            method: "POST",
            headers: {
                Authorization: basic,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
```

After:
```ts
        const res = await fetch(`${base}/v3/vault/payment-tokens`, {
            method: "POST",
            headers: buildPayPalRequestHeaders(req, basic),
            body: JSON.stringify(payload),
        });
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/paypal/vault/create-setup-token-for-paypal-save-payment/route.ts \
        app/api/paypal/vault/payment-token/create/route.ts
git commit -m "$(cat <<'EOF'
feat[2026-07-16]: vault setup-token/payment-token 转发 PayPal-Auth-Assertion 头

## 主要改动
- app/api/paypal/vault/create-setup-token-for-paypal-save-payment/route.ts
- app/api/paypal/vault/payment-token/create/route.ts
两个文件 headers 均改用 buildPayPalRequestHeaders(req, basic)
EOF
)"
```

---

## Task 11: Wire the header helper into `subscription/create` (4 internal PayPal calls)

**Files:**
- Modify: `app/api/paypal/subscription/create/route.ts`

- [ ] **Step 1: Replace the file contents**

Current content:
```ts
import { buildBasicAuthHeader, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
import { NextResponse } from "next/server";
import consola from "consola";

export const runtime = 'edge';

async function getAccessToken(base: string, basic: string): Promise<string> {
    const res = await fetch(`${base}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: basic,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });
    if (!res.ok) throw new Error(`Failed to get access token: ${res.status}`);
    const json = await res.json();
    return json.access_token;
}

async function createProduct(base: string, token: string): Promise<string> {
    const res = await fetch(`${base}/v1/catalogs/products`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: "Sample Subscription Product",
            description: "Sample product for subscription testing",
            type: "SERVICE",
            category: "SOFTWARE",
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create product: ${text}`);
    }
    const json = await res.json();
    return json.id;
}

async function createBillingPlan(base: string, token: string, productId: string): Promise<string> {
    const res = await fetch(`${base}/v1/billing/plans`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
        },
        body: JSON.stringify({
            product_id: productId,
            name: "Sample Monthly Plan",
            description: "9.99/month subscription",
            status: "ACTIVE",
            billing_cycles: [
                {
                    frequency: { interval_unit: "MONTH", interval_count: 1 },
                    tenure_type: "REGULAR",
                    sequence: 1,
                    total_cycles: 0,
                    pricing_scheme: {
                        fixed_price: { currency_code: "USD", value: "9.99" },
                    },
                },
            ],
            payment_preferences: {
                auto_bill_outstanding: true,
                setup_fee: { currency_code: "USD", value: "0.00" },
                payment_failure_threshold: 3,
            },
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create billing plan: ${text}`);
    }
    const json = await res.json();
    return json.id;
}

export async function POST(req: Request) {
    consola.info("[/api/paypal/subscription/create] HTTP POST received");
    try {
        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        const basic = buildBasicAuthHeader(clientId, clientSecret);

        const body = await req.json().catch(() => ({}));

        // Use planId from request body, then env var, then auto-create
        let planId: string = body.planId ?? process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID ?? "";

        if (!planId) {
            consola.info("No planId configured — creating product and billing plan on the fly");
            const accessToken = await getAccessToken(base, basic);
            const productId = await createProduct(base, accessToken);
            consola.info("Created product:", productId);
            planId = await createBillingPlan(base, accessToken, productId);
            consola.info("Created billing plan:", planId);
        }

        const createRes = await fetch(`${base}/v1/billing/subscriptions`, {
            method: "POST",
            headers: {
                Authorization: basic,
                "Content-Type": "application/json",
                Accept: "application/json",
                Prefer: "return=minimal",
            },
            body: JSON.stringify({
                plan_id: planId,
                application_context: {
                    brand_name: "EXAMPLE INC",
                    locale: "en-US",
                    shipping_preference: "NO_SHIPPING",
                    user_action: "SUBSCRIBE_NOW",
                },
            }),
        });

        const createText = await createRes.text();
        if (!createRes.ok) {
            let details: any = createText;
            try { details = JSON.parse(createText); } catch { }
            consola.error("PayPal subscription create failed:", details);
            return NextResponse.json(
                { error: "failed to create subscription", details },
                { status: 502 }
            );
        }

        const createJson = JSON.parse(createText);
        consola.info("Subscription created:", createJson.id);
        return NextResponse.json(createJson);
    } catch (err: any) {
        consola.error("Subscription create error:", err);
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}
```

New content (threads `req` into the three helper functions so all 4 PayPal calls forward the Auth-Assertion header):
```ts
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

async function createProduct(base: string, token: string, req: Request): Promise<string> {
    const res = await fetch(`${base}/v1/catalogs/products`, {
        method: "POST",
        headers: buildPayPalRequestHeaders(req, `Bearer ${token}`),
        body: JSON.stringify({
            name: "Sample Subscription Product",
            description: "Sample product for subscription testing",
            type: "SERVICE",
            category: "SOFTWARE",
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create product: ${text}`);
    }
    const json = await res.json();
    return json.id;
}

async function createBillingPlan(base: string, token: string, productId: string, req: Request): Promise<string> {
    const res = await fetch(`${base}/v1/billing/plans`, {
        method: "POST",
        headers: buildPayPalRequestHeaders(req, `Bearer ${token}`, { Prefer: "return=minimal" }),
        body: JSON.stringify({
            product_id: productId,
            name: "Sample Monthly Plan",
            description: "9.99/month subscription",
            status: "ACTIVE",
            billing_cycles: [
                {
                    frequency: { interval_unit: "MONTH", interval_count: 1 },
                    tenure_type: "REGULAR",
                    sequence: 1,
                    total_cycles: 0,
                    pricing_scheme: {
                        fixed_price: { currency_code: "USD", value: "9.99" },
                    },
                },
            ],
            payment_preferences: {
                auto_bill_outstanding: true,
                setup_fee: { currency_code: "USD", value: "0.00" },
                payment_failure_threshold: 3,
            },
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create billing plan: ${text}`);
    }
    const json = await res.json();
    return json.id;
}

export async function POST(req: Request) {
    consola.info("[/api/paypal/subscription/create] HTTP POST received");
    try {
        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        const basic = buildBasicAuthHeader(clientId, clientSecret);

        const body = await req.json().catch(() => ({}));

        // Use planId from request body, then env var, then auto-create
        let planId: string = body.planId ?? process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID ?? "";

        if (!planId) {
            consola.info("No planId configured — creating product and billing plan on the fly");
            const accessToken = await getAccessToken(base, basic, req);
            const productId = await createProduct(base, accessToken, req);
            consola.info("Created product:", productId);
            planId = await createBillingPlan(base, accessToken, productId, req);
            consola.info("Created billing plan:", planId);
        }

        const createRes = await fetch(`${base}/v1/billing/subscriptions`, {
            method: "POST",
            headers: buildPayPalRequestHeaders(req, basic, { Accept: "application/json", Prefer: "return=minimal" }),
            body: JSON.stringify({
                plan_id: planId,
                application_context: {
                    brand_name: "EXAMPLE INC",
                    locale: "en-US",
                    shipping_preference: "NO_SHIPPING",
                    user_action: "SUBSCRIBE_NOW",
                },
            }),
        });

        const createText = await createRes.text();
        if (!createRes.ok) {
            let details: any = createText;
            try { details = JSON.parse(createText); } catch { }
            consola.error("PayPal subscription create failed:", details);
            return NextResponse.json(
                { error: "failed to create subscription", details },
                { status: 502 }
            );
        }

        const createJson = JSON.parse(createText);
        consola.info("Subscription created:", createJson.id);
        return NextResponse.json(createJson);
    } catch (err: any) {
        consola.error("Subscription create error:", err);
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/paypal/subscription/create/route.ts
git commit -m "$(cat <<'EOF'
feat[2026-07-16]: subscription/create 全部 4 个 PayPal 调用转发 Auth-Assertion 头

## 主要改动
- app/api/paypal/subscription/create/route.ts: getAccessToken/createProduct/createBillingPlan 新增 req 参数并改用 buildPayPalRequestHeaders，最终的 create subscription 调用同样改造

## 为什么这么改
用户要求这个文件里所有 PayPal 调用都带上 Auth-Assertion，即使 product/billing-plan 调用不是商户级资源，也统一处理，避免遗漏。
EOF
)"
```

---

## Task 12: Add Integration Mode UI to `SdkConfigPanel`

**Files:**
- Modify: `components/panels/SdkConfigPanel.tsx`

- [ ] **Step 1: Update imports**

Before:
```tsx
"use client";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

import { useState } from "react";
import {
    LIVE_CLIENT_ID_C2,
    LIVE_SECRET_C2,
    SANDBOX_CLIENT_ID_C2,
    SANDBOX_SECRET_ID_C2,
    useEnvStore,
} from "@/store/useEnvStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VaultManagerDialog } from "@/components/panels/VaultManagerDialog";
import {
    CredentialCombobox,
    type CredentialOption,
} from "@/components/ui/CredentialCombobox";
import { useSettingsChange } from "@/hooks/useSettingsChange";
import { AlertTriangle, KeyRound, Coins } from "lucide-react";
import type { PayPalEnv, AuthMode } from "@/types/env";
```

After:
```tsx
"use client";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

import { useState } from "react";
import {
    LIVE_CLIENT_ID_C2,
    LIVE_SECRET_C2,
    SANDBOX_CLIENT_ID_C2,
    SANDBOX_SECRET_ID_C2,
    useEnvStore,
} from "@/store/useEnvStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { VaultManagerDialog } from "@/components/panels/VaultManagerDialog";
import {
    CredentialCombobox,
    type CredentialOption,
} from "@/components/ui/CredentialCombobox";
import { useSettingsChange } from "@/hooks/useSettingsChange";
import { AlertTriangle, KeyRound, Coins } from "lucide-react";
import type { PayPalEnv, AuthMode, IntegrationMode } from "@/types/env";
```

- [ ] **Step 2: Update the store destructure**

Before:
```tsx
    const {
        env,
        authMode,
        clientId,
        secret,
        liveClientId,
        liveSecret,
        setEnv,
        setAuthMode,
        setClientId,
        setSecret,
        setLiveClientId,
        setLiveSecret,
        reset,
    } = useEnvStore();
```

After:
```tsx
    const {
        env,
        authMode,
        integrationMode,
        clientId,
        secret,
        liveClientId,
        liveSecret,
        partnerClientId,
        partnerSecret,
        livePartnerClientId,
        livePartnerSecret,
        authAssertionMerchantId,
        liveAuthAssertionMerchantId,
        setEnv,
        setAuthMode,
        setIntegrationMode,
        setClientId,
        setSecret,
        setLiveClientId,
        setLiveSecret,
        setPartnerClientId,
        setPartnerSecret,
        setLivePartnerClientId,
        setLivePartnerSecret,
        setAuthAssertionMerchantId,
        setLiveAuthAssertionMerchantId,
        reset,
    } = useEnvStore();
```

- [ ] **Step 3: Add partner local state and derived active-partner values**

Before:
```tsx
    const isSandbox = env === "sandbox";

    const [localClientId, setLocalClientId] = useState(clientId);
    const [localSecret, setLocalSecret] = useState(secret);
    const [localLiveClientId, setLocalLiveClientId] = useState(liveClientId);
    const [localLiveSecret, setLocalLiveSecret] = useState(liveSecret);
    const [saved, setSaved] = useState(false);
    const [showLiveConfirm, setShowLiveConfirm] = useState(false);

    const activeLocalClientId = isSandbox ? localClientId : localLiveClientId;
    const activeLocalSecret = isSandbox ? localSecret : localLiveSecret;
    const setActiveLocalClientId = isSandbox
        ? setLocalClientId
        : setLocalLiveClientId;
    const setActiveLocalSecret = isSandbox
        ? setLocalSecret
        : setLocalLiveSecret;
```

After:
```tsx
    const isSandbox = env === "sandbox";
    const isPartnerMode = integrationMode === "partner";

    const [localClientId, setLocalClientId] = useState(clientId);
    const [localSecret, setLocalSecret] = useState(secret);
    const [localLiveClientId, setLocalLiveClientId] = useState(liveClientId);
    const [localLiveSecret, setLocalLiveSecret] = useState(liveSecret);
    const [localPartnerClientId, setLocalPartnerClientId] = useState(partnerClientId);
    const [localPartnerSecret, setLocalPartnerSecret] = useState(partnerSecret);
    const [localLivePartnerClientId, setLocalLivePartnerClientId] = useState(livePartnerClientId);
    const [localLivePartnerSecret, setLocalLivePartnerSecret] = useState(livePartnerSecret);
    const [localAuthAssertionMerchantId, setLocalAuthAssertionMerchantId] = useState(authAssertionMerchantId);
    const [localLiveAuthAssertionMerchantId, setLocalLiveAuthAssertionMerchantId] = useState(liveAuthAssertionMerchantId);
    const [saved, setSaved] = useState(false);
    const [showLiveConfirm, setShowLiveConfirm] = useState(false);

    const activeLocalClientId = isSandbox ? localClientId : localLiveClientId;
    const activeLocalSecret = isSandbox ? localSecret : localLiveSecret;
    const setActiveLocalClientId = isSandbox
        ? setLocalClientId
        : setLocalLiveClientId;
    const setActiveLocalSecret = isSandbox
        ? setLocalSecret
        : setLocalLiveSecret;

    const activeLocalPartnerClientId = isSandbox ? localPartnerClientId : localLivePartnerClientId;
    const activeLocalPartnerSecret = isSandbox ? localPartnerSecret : localLivePartnerSecret;
    const setActiveLocalPartnerClientId = isSandbox
        ? setLocalPartnerClientId
        : setLocalLivePartnerClientId;
    const setActiveLocalPartnerSecret = isSandbox
        ? setLocalPartnerSecret
        : setLocalLivePartnerSecret;

    const activeLocalAuthAssertionMerchantId = isSandbox
        ? localAuthAssertionMerchantId
        : localLiveAuthAssertionMerchantId;
    const setActiveLocalAuthAssertionMerchantId = isSandbox
        ? setLocalAuthAssertionMerchantId
        : setLocalLiveAuthAssertionMerchantId;
```

- [ ] **Step 4: Add the integration-mode toggle handler (place it right after `handleEnvToggle`/`confirmSwitchToLive`, before `handleSave`)**

Before:
```tsx
    const confirmSwitchToLive = async () => {
        setShowLiveConfirm(false);
        setEnv("live");
        await applySettingsChange();
    };

    const handleSave = async () => {
        const prevClientId = isSandbox ? clientId : liveClientId;
        const prevSecret = isSandbox ? secret : liveSecret;
        const changed =
            activeLocalClientId !== prevClientId ||
            activeLocalSecret !== prevSecret;

        if (isSandbox) {
            setClientId(localClientId);
            setSecret(localSecret);
        } else {
            setLiveClientId(localLiveClientId);
            setLiveSecret(localLiveSecret);
        }

        if (changed) {
            await applySettingsChange();
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };
```

After:
```tsx
    const confirmSwitchToLive = async () => {
        setShowLiveConfirm(false);
        setEnv("live");
        await applySettingsChange();
    };

    const handleIntegrationModeToggle = async (mode: IntegrationMode) => {
        if (mode === integrationMode) return;
        setIntegrationMode(mode);
        await applySettingsChange();
    };

    const handleSave = async () => {
        const prevClientId = isSandbox ? clientId : liveClientId;
        const prevSecret = isSandbox ? secret : liveSecret;
        const prevPartnerClientId = isSandbox ? partnerClientId : livePartnerClientId;
        const prevPartnerSecret = isSandbox ? partnerSecret : livePartnerSecret;
        const prevAuthAssertionMerchantId = isSandbox
            ? authAssertionMerchantId
            : liveAuthAssertionMerchantId;

        const changed =
            activeLocalClientId !== prevClientId ||
            activeLocalSecret !== prevSecret ||
            activeLocalPartnerClientId !== prevPartnerClientId ||
            activeLocalPartnerSecret !== prevPartnerSecret ||
            activeLocalAuthAssertionMerchantId !== prevAuthAssertionMerchantId;

        if (isSandbox) {
            setClientId(localClientId);
            setSecret(localSecret);
            setPartnerClientId(localPartnerClientId);
            setPartnerSecret(localPartnerSecret);
            setAuthAssertionMerchantId(localAuthAssertionMerchantId);
        } else {
            setLiveClientId(localLiveClientId);
            setLiveSecret(localLiveSecret);
            setLivePartnerClientId(localLivePartnerClientId);
            setLivePartnerSecret(localLivePartnerSecret);
            setLiveAuthAssertionMerchantId(localLiveAuthAssertionMerchantId);
        }

        if (changed) {
            await applySettingsChange();
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };
```

- [ ] **Step 5: Update `handleReset` to also clear partner fields**

Before:
```tsx
    const handleReset = async () => {
        reset();
        setLocalClientId(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "");
        setLocalSecret(process.env.NEXT_PUBLIC_PAYPAL_SECRET ?? "");
        setLocalLiveClientId(LIVE_CLIENT_ID_C2);
        setLocalLiveSecret(LIVE_SECRET_C2);
        await applySettingsChange();
    };
```

After:
```tsx
    const handleReset = async () => {
        reset();
        setLocalClientId(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "");
        setLocalSecret(process.env.NEXT_PUBLIC_PAYPAL_SECRET ?? "");
        setLocalLiveClientId(LIVE_CLIENT_ID_C2);
        setLocalLiveSecret(LIVE_SECRET_C2);
        setLocalPartnerClientId("");
        setLocalPartnerSecret("");
        setLocalLivePartnerClientId("");
        setLocalLivePartnerSecret("");
        setLocalAuthAssertionMerchantId("");
        setLocalLiveAuthAssertionMerchantId("");
        await applySettingsChange();
    };
```

- [ ] **Step 6: Insert the "集成模式" section after the Environment section, before the Credentials section**

Before:
```tsx
                        {!isSandbox && (
                            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                ⚠️ Live environment — real transactions may
                                occur
                            </p>
                        )}
                    </section>

                    {/* ────── Credentials ────── */}
                    <section>
                        <p className={SECTION_TITLE_CLS}>Credentials</p>
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="clientId"
                                    className="block text-sm font-medium mb-2 flex items-center gap-2"
                                >
                                    <span className="text-lg">🔑</span>
                                    PayPal Client ID
                                </label>
                                <CredentialCombobox
                                    value={activeLocalClientId}
                                    onChange={handleClientIdChange}
                                    options={clientIdOptions}
                                    placeholder="Select or enter Client ID"
                                    inputType="text"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="secret"
                                    className="block text-sm font-medium mb-2 flex items-center gap-2"
                                >
                                    <span className="text-lg">🔐</span>
                                    PayPal Secret
                                </label>
                                <CredentialCombobox
                                    value={activeLocalSecret}
                                    onChange={setActiveLocalSecret}
                                    options={secretOptions}
                                    placeholder="Select or enter Secret"
                                    inputType="password"
                                />
                            </div>

                            <div className="flex items-center flex-wrap gap-3">
                                <Button
                                    onClick={handleSave}
                                    className="shadow-md hover:shadow-lg transition-shadow"
                                >
                                    💾 Save Configuration
                                </Button>
                                <Button
                                    onClick={handleReset}
                                    variant="secondary"
                                    className="shadow-md hover:shadow-lg transition-shadow"
                                >
                                    🔄 Reset
                                </Button>
                                <VaultManagerDialog />
                                {saved && (
                                    <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                                        ✅ Saved — SDK reloading
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>
```

After:
```tsx
                        {!isSandbox && (
                            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                ⚠️ Live environment — real transactions may
                                occur
                            </p>
                        )}
                    </section>

                    {/* ────── Integration Mode ────── */}
                    <section>
                        <p className={SECTION_TITLE_CLS}>集成模式</p>
                        <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm">
                            <button
                                type="button"
                                onClick={() => handleIntegrationModeToggle("merchant")}
                                className={`px-4 py-1.5 transition-colors ${
                                    !isPartnerMode
                                        ? "bg-blue-600 text-white font-semibold"
                                        : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                一方 Merchant
                            </button>
                            <button
                                type="button"
                                onClick={() => handleIntegrationModeToggle("partner")}
                                className={`px-4 py-1.5 transition-colors ${
                                    isPartnerMode
                                        ? "bg-blue-600 text-white font-semibold"
                                        : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                三方 Partner
                            </button>
                        </div>
                    </section>

                    {/* ────── Credentials ────── */}
                    <section>
                        <p className={SECTION_TITLE_CLS}>Credentials</p>
                        {isPartnerMode ? (
                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="partnerClientId"
                                        className="block text-sm font-medium mb-2 flex items-center gap-2"
                                    >
                                        <span className="text-lg">🔑</span>
                                        Partner Client ID
                                    </label>
                                    <Input
                                        id="partnerClientId"
                                        value={activeLocalPartnerClientId}
                                        onChange={(e) => setActiveLocalPartnerClientId(e.target.value)}
                                        placeholder="test_partner_client_id"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="partnerSecret"
                                        className="block text-sm font-medium mb-2 flex items-center gap-2"
                                    >
                                        <span className="text-lg">🔐</span>
                                        Partner Client Secret
                                    </label>
                                    <Input
                                        id="partnerSecret"
                                        type="password"
                                        value={activeLocalPartnerSecret}
                                        onChange={(e) => setActiveLocalPartnerSecret(e.target.value)}
                                        placeholder="test_partner_client_secret"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="authAssertionMerchantId"
                                        className="block text-sm font-medium mb-2 flex items-center gap-2"
                                    >
                                        <span className="text-lg">🪪</span>
                                        授权 Merchant ID
                                        <span className="text-xs font-normal text-muted-foreground">
                                            （用于 Auth Assertion）
                                        </span>
                                    </label>
                                    <Input
                                        id="authAssertionMerchantId"
                                        value={activeLocalAuthAssertionMerchantId}
                                        onChange={(e) => setActiveLocalAuthAssertionMerchantId(e.target.value)}
                                        placeholder="test_partner_merchant_id"
                                    />
                                </div>

                                <div className="flex items-center flex-wrap gap-3">
                                    <Button
                                        onClick={handleSave}
                                        className="shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        💾 Save Configuration
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                        className="shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        🔄 Reset
                                    </Button>
                                    {saved && (
                                        <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                                            ✅ Saved — SDK reloading
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="clientId"
                                        className="block text-sm font-medium mb-2 flex items-center gap-2"
                                    >
                                        <span className="text-lg">🔑</span>
                                        PayPal Client ID
                                    </label>
                                    <CredentialCombobox
                                        value={activeLocalClientId}
                                        onChange={handleClientIdChange}
                                        options={clientIdOptions}
                                        placeholder="Select or enter Client ID"
                                        inputType="text"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="secret"
                                        className="block text-sm font-medium mb-2 flex items-center gap-2"
                                    >
                                        <span className="text-lg">🔐</span>
                                        PayPal Secret
                                    </label>
                                    <CredentialCombobox
                                        value={activeLocalSecret}
                                        onChange={setActiveLocalSecret}
                                        options={secretOptions}
                                        placeholder="Select or enter Secret"
                                        inputType="password"
                                    />
                                </div>

                                <div className="flex items-center flex-wrap gap-3">
                                    <Button
                                        onClick={handleSave}
                                        className="shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        💾 Save Configuration
                                    </Button>
                                    <Button
                                        onClick={handleReset}
                                        variant="secondary"
                                        className="shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        🔄 Reset
                                    </Button>
                                    <VaultManagerDialog />
                                    {saved && (
                                        <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                                            ✅ Saved — SDK reloading
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Manual UI verification**

Run: `npm run dev`, open the home page in a browser.
- Click "三方 Partner" — confirm the Credentials block switches to Partner Client ID / Partner Client Secret / 授权 Merchant ID fields, and the SDK reloads (brief "Saved — SDK reloading" is not shown yet since mode toggle alone doesn't show `saved`, but no console errors should appear and `window.paypal` should be reloaded — check devtools Network tab for a fresh SDK script request).
- Type values into all three partner fields, click "💾 Save Configuration" — confirm "✅ Saved — SDK reloading" appears.
- Toggle Sandbox/Live — confirm partner fields swap to the other env's (empty) values, confirming the sandbox/live split works.
- Click "一方 Merchant" — confirm it reverts to the original Client ID/Secret dropdown UI.
- Click "🔄 Reset" while in partner mode — confirm it goes back to "一方 Merchant" mode with default 1st-party credentials.

- [ ] **Step 9: Commit**

```bash
git add components/panels/SdkConfigPanel.tsx
git commit -m "$(cat <<'EOF'
feat[2026-07-16]: SdkConfigPanel 新增三方 Partner 集成模式切换

## 解决的问题
UI 上没有入口配置三方 Partner 凭据和授权 Merchant ID，用户无法切换到三方模式测试 Auth-Assertion 场景。

## 主要改动
- components/panels/SdkConfigPanel.tsx: 新增"集成模式"(一方 Merchant / 三方 Partner) 切换区块；Credentials 区块按模式互斥展示一方 Client ID/Secret 或三方 Partner Client ID/Secret/授权 Merchant ID；Save/Reset 逻辑覆盖新字段

## 为什么这么改
沿用现有 Environment toggle 的视觉样式和 local-state-then-save 交互模式，保持面板整体风格一致；互斥展示（而不是叠加显示）与用户提供的 mockup 一致，也避免用户误填错凭据。
EOF
)"
```

---

## Task 13: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full type check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both pass with no errors.

- [ ] **Step 2: Start the dev server**

Run: `npm run dev`

- [ ] **Step 3: Verify header propagation with curl (bypassing the UI)**

With the dev server running on `http://localhost:3000` (adjust port if different), simulate what the browser sends in partner mode:

```bash
curl -s -X POST http://localhost:3000/api/paypal/order/create/create-order \
  -H "Content-Type: application/json" \
  -H "x-paypal-client-id: <sandbox partner client id>" \
  -H "x-paypal-secret: <sandbox partner secret>" \
  -H "x-paypal-env: sandbox" \
  -H "x-paypal-auth-assertion: eyJhbGciOiJub25lIn0=.eyJpc3MiOiJ0ZXN0IiwicGF5ZXJfaWQiOiJtZXJjaGFudDEyMyJ9." \
  -d '{"items":[{"name":"Test","unitPrice":10,"quantity":1}],"totalAmount":10,"currency":"USD"}'
```

Expected: the request either succeeds (if the partner credentials are valid sandbox credentials) or fails with a PayPal API error about invalid assertion/credentials — either way, confirm via server logs (`consola.debug` output in the terminal running `npm run dev`) or by temporarily adding a `consola.log(authAssertion)` in `buildPayPalRequestHeaders` that the `PayPal-Auth-Assertion` header was actually attached to the outbound `fetch` (remove any temporary logging before finishing).

- [ ] **Step 4: Verify the merchant-mode path still works unchanged**

In the browser, with "一方 Merchant" selected, run through one existing buyer flow (e.g. the basic Buttons test case) end to end — create order and capture should succeed exactly as before, confirming Task 6-11's refactor didn't change behavior for the non-partner path (no `x-paypal-auth-assertion` header is sent, so `buildPayPalRequestHeaders` omits `PayPal-Auth-Assertion` entirely).

- [ ] **Step 5: Verify the partner-mode path in the browser**

Switch to "三方 Partner", fill in valid sandbox partner client id/secret and a real authorized merchant id (if available) or the placeholder test values, save, then run through the same buyer flow. Confirm in the browser's Network tab that the request to `/api/paypal/order/create/create-order` includes `x-paypal-auth-assertion`, and (if you have server-side visibility) that the outbound call to PayPal includes `PayPal-Auth-Assertion`.

- [ ] **Step 6: Final commit (only if verification uncovered fixes)**

If Steps 3-5 required any code changes, commit them following the same commit message format as prior tasks. If verification passed with no changes needed, no commit is required for this task.
