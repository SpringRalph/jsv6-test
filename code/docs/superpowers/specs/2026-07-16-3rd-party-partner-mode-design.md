# 3rd Party (Partner) Integration Mode — Design

## 解决的问题

目前 jsv6-test 只支持"一方"（1st party merchant）模式：SDK 初始化和后端下单/capture 请求都使用同一套 merchant 的 clientId/secret。

现在需要支持"三方"（3rd party partner）模式：以 partner 身份代表下游商户操作，创建订单/capture 时需要带上 `PayPal-Auth-Assertion` 头来声明"partner 在代表哪个 merchant 操作"。不需要实现 Create Partner Referral 授权流程，只需要一个模式切换 + 手动填入 partner 凭据和已授权的 merchant id。

## 主要改动

### 1. 数据模型 — `types/env.ts`

```ts
export type IntegrationMode = "merchant" | "partner"

export interface EnvState {
  env: PayPalEnv
  authMode: AuthMode
  integrationMode: IntegrationMode

  // 一方 / merchant 凭据（现有字段不变）
  clientId: string
  secret: string
  liveClientId: string
  liveSecret: string

  // 三方 / partner 凭据，按 sandbox/live 分两套
  partnerClientId: string
  partnerSecret: string
  livePartnerClientId: string
  livePartnerSecret: string

  // 授权 merchant id（用于 Auth-Assertion payer_id），按 sandbox/live 分两套
  authAssertionMerchantId: string
  liveAuthAssertionMerchantId: string
}
```

### 2. Store — `store/useEnvStore.ts`

- 新增对应 setter：`setIntegrationMode` / `setPartnerClientId` / `setPartnerSecret` / `setLivePartnerClientId` / `setLivePartnerSecret` / `setAuthAssertionMerchantId` / `setLiveAuthAssertionMerchantId`。
- `envDefaults` 新增以上字段的默认值（`integrationMode: "merchant"`，其余为空字符串）。
- 改造 `activeClientId()` / `activeSecret()`：当 `integrationMode === "partner"` 时返回 partner 一套（按当前 env 选 sandbox/live），否则维持现有逻辑不变。
- 新增 `activeAuthAssertionMerchantId()`：按当前 env 返回 `authAssertionMerchantId` 或 `liveAuthAssertionMerchantId`。
- `reset()` 同时重置新字段。

这样 `useSdkInitOptions.ts`（`clientId` 模式下用 `activeClientId()`）和所有走 `getPayPalHeaders()` 的下单请求会自动在三方模式下使用 partner 凭据，无需改动这两处消费方的核心逻辑。

### 3. Auth-Assertion 生成 — 新文件 `services/paypal-sdk-function/auth-assertion.ts`

浏览器端计算，格式与业界一致的"无签名 JWT"：

```ts
export function buildAuthAssertionHeader(clientId: string, merchantId: string): string {
  const header = "eyJhbGciOiJub25lIn0="; // base64({"alg":"none"})
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ iss: clientId, payer_id: merchantId }))));
  return `${header}.${payload}.`;
}
```

### 4. 请求头透传 — `services/paypal-sdk-function/paypal-headers.ts`

```ts
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

### 5. 服务端转发 — `services/paypal-server-side-function/server-function.ts`

新增共享 helper，替代各 route 里手写的 `headers: { Authorization: basic, ... }`：

```ts
export function buildPayPalRequestHeaders(req: Request, basic: string, extra?: Record<string, string>) {
  const headers: Record<string, string> = { Authorization: basic, "Content-Type": "application/json", ...extra };
  const authAssertion = req.headers.get("x-paypal-auth-assertion");
  if (authAssertion) headers["PayPal-Auth-Assertion"] = authAssertion;
  return headers;
}
```

### 6. 覆盖范围 — 需要改造调用 PayPal API 的 route.ts（共 16 处，把手写 headers 换成 `buildPayPalRequestHeaders(...)`）

Order create（10 个变体）：
- `order/create/create-order/route.ts`
- `order/create/create-order-ACDC/route.ts`
- `order/create/create-order-ACDC-With-3DS/route.ts`
- `order/create/create-order-bcdc/route.ts`
- `order/create/create-order-bcdc-with-more-info/route.ts`
- `order/create/create-order-bcdc-with-more-info-with-email/route.ts`
- `order/create/create-order-EUR/route.ts`
- `order/create/create-order-PLN/route.ts`
- `order/create/create-order-redirect/route.ts`
- `order/create/create-order-paypal-one-time-payment-with-vault/route.ts`
- `order/create/create-order-paypal-with-vault-id/route.ts`

Order capture / get：
- `order/capture/capture-order/route.ts`
- `order/get/get-order/route.ts`

Vault：
- `vault/create-setup-token-for-paypal-save-payment/route.ts`
- `vault/payment-token/create/route.ts`

Subscription（该文件内 4 个 PayPal 调用全部加上：get access token、create product、create billing plan、create subscription）：
- `subscription/create/route.ts`

不改动：`client-token/route.ts`（纯 OAuth token 获取，与具体 merchant 无关）、`find-eligible-methods/route.ts`（非商户级操作）。

### 7. UI — `components/panels/SdkConfigPanel.tsx`

- Environment 区块下新增「集成模式」(Integration Mode) 区块，样式与 Environment toggle 一致（inline-flex 两个按钮）：`一方 Merchant` / `三方 Partner`。
- Credentials 区块两种模式互斥显示：
  - `merchant` 模式：维持现状（Client ID / Secret，`CredentialCombobox` 下拉）。
  - `partner` 模式：替换为三个纯文本 `Input`（参考 mockup 样式，不用下拉）：
    - Partner Client ID
    - Partner Client Secret（password 类型）
    - 授权 Merchant ID（用于 Auth Assertion）
- 沿用现有的 local state + Save/Reset 模式（`localPartnerClientId` 等），切换 env/mode 时不丢失未保存的草稿，`handleSave`/`handleReset` 一并处理新字段。
- 切换集成模式本身也需要触发 `applySettingsChange()`（复用现有 `handleAuthModeToggle` 的模式），因为凭据来源变了，SDK 需要重新加载。
- SDK Init Mode（clientToken/clientId）区块不变，两种集成模式下都适用。

## 为什么这么改

- **复用现有 sandbox/live 分离 + local-state-then-save 的模式**，而不是发明新的状态管理方式，保持整个面板行为一致（这也是用户明确要求的"式样和其他元素保持一致"）。
- **Auth-Assertion 在浏览器端计算、通过 header 透传到服务端**，而不是让每个 route.ts 各自算一遍：计算逻辑只写一次，服务端只需要透传已算好的字符串，改动面小（每个 route 一行）。
- **用共享 helper `buildPayPalRequestHeaders` 收敛 16 个 route 的 header 构造**，避免手写 16 遍 `if (authAssertion) headers[...] = ...` 导致遗漏或不一致。
- **不实现 Create Partner Referral**：按用户要求，这是纯测试工具，直接手填已知的 merchant id 即可，不需要真实的商户 onboarding 流程。
- **`client-token` 和 `find-eligible-methods` 不改**：这两个接口不是"以 partner 身份代表某个 merchant 操作"的资源级调用，带 Auth-Assertion 没有意义。

## 范围确认

- Auth-Assertion 覆盖：所有 order create 变体 + capture + get-order + vault（setup-token / payment-token）+ subscription（全部 4 个内部调用）。
- Partner 凭据、授权 Merchant ID 均按 Sandbox / Live 分两套存储，与现有一方凭据的模式对称。
- 不实现 partner referral / onboarding；不新增测试流程页面；仅在 `SdkConfigPanel` 增加模式切换和字段输入。
