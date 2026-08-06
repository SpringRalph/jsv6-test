# Apple Pay Domain Register/Deregister Panel

## 问题

Apple Pay 测试用例页面（`code/app/jsv6-test-cases/advanced/applePay/page.tsx`）目前依赖手动登录 PayPal 后台去注册/解绑 Apple Pay 域名，流程繁琐。需要在页面内直接提供注册、查询、解绑域名的能力。

该能力仅在三方模式（`integrationMode === "partner"`）下可用，因为 PayPal 的 wallet-domains API 要求 `PayPal-Auth-Assertion` 头，而该头只有 partner 模式下才会生成（见 `services/paypal-sdk-function/paypal-headers.ts`）。一方模式下需要将功能置灰并提示。

## API 参考（来自 PayPal 官方文档 platforms/checkout/apm/apple-pay）

所有请求都需要：
- `Authorization: Bearer <access_token>`（通过 `/v1/oauth2/token` client_credentials 获取）
- `PayPal-Auth-Assertion: <auth_assertion>`（标识代注册的商户）

| 操作 | 方法 | 路径 | Body |
|---|---|---|---|
| 查询已注册域名 | GET | `/v1/customer/wallet-domains` | 无，响应体含 `wallet_domains` 字段 |
| 注册域名 | POST | `/v1/customer/wallet-domains` | `{"provider_type":"APPLE_PAY","domain":{"name":"example.com"}}` → 201 |
| 解绑域名 | POST | `/v1/customer/unregister-wallet-domain` | `{"provider_type":"APPLE_PAY","domain":{"name":"example.com"},"reason":"..."}` → 200 |

## 设计

### 1. API 路由：`code/app/api/paypal/apple-pay/domain-registration/route.ts`

复用现有模式（参考 `app/api/paypal/order/create/create-order/route.ts` 和 `app/api/paypal/subscription/create/route.ts`）：

```
getPayPalConfigFromRequest(req) → { clientId, clientSecret, base }
buildBasicAuthHeader(clientId, clientSecret)
getAccessToken(base, basic, req)  // POST /v1/oauth2/token
```

- `export async function GET(req)`：调用 `${base}/v1/customer/wallet-domains`，返回 `{ domains: json.wallet_domains ?? [] }`
- `export async function POST(req)`：body `{ domain: string }`，调用 `${base}/v1/customer/wallet-domains`，body `{"provider_type":"APPLE_PAY","domain":{"name":domain}}`
- `export async function DELETE(req)`：body `{ domain: string, reason?: string }`，调用 `${base}/v1/customer/unregister-wallet-domain`，body `{"provider_type":"APPLE_PAY","domain":{"name":domain},"reason": reason || "Merchant requested to deregister domain"}`

三个 handler 共用的前置校验：若请求头中没有 `x-paypal-auth-assertion`（即非 partner 模式），直接返回 `400 { error: "Apple Pay domain registration requires partner/three-party integration mode" }`，不发起外部调用。

错误处理与现有路由一致：外部调用非 2xx 时返回 `502` 并附带 PayPal 返回的 details；内部异常返回 `500`。

### 2. 客户端组件：`code/components/panels/ApplePayDomainPanel.tsx`

- `"use client"`，通过 `useEnvStore()` 读取 `integrationMode`。
- **一方模式**：整个卡片置灰（`opacity-50 pointer-events-none` 或 disabled 表单元素），显示提示文案："域名注册/解绑仅在三方模式（Partner）下可用，请在 EnvPanel 中切换 Integration Mode"。
- **三方模式**：
  - 顶部：域名输入框，`useState` 初始值为 `window.location.hostname`（`useEffect` 中设置，避免 SSR mismatch）
  - "注册域名" 按钮：`POST` 到新路由，headers 用 `getPayPalHeaders()`，成功/失败用 `toast.success` / `toast.error`（`react-hot-toast`），成功后刷新列表
  - 已注册域名列表：组件挂载时 `GET` 一次；每行域名旁边一个"解绑"按钮
  - 解绑：每行展开一个可选的 reason 输入框（默认留空），点击"解绑"调用 `DELETE`，body 里 reason 为空时不传（由后端补默认文案），成功后 toast 并刷新列表
- 样式与页面其他卡片一致：`border-2 border-blue-200 dark:border-blue-800`，`bg-gradient-to-br from-blue-500/5 to-indigo-500/5` 渐变背景，圆角卡片，与 `CartSummary` / `PaymentPlaceholder` 的视觉语言保持统一。

### 3. 页面接入

`code/app/jsv6-test-cases/advanced/applePay/page.tsx`：在左列 `<CartSummary />` 之后插入 `<ApplePayDomainPanel />`（同一个 `space-y-6` 容器内）。

## 不做的事情

- 不处理 `.well-known/apple-developer-merchantid-domain-association` 文件托管（域名归属校验是另一套机制，超出本次范围）。
- 不做多域名批量操作、不做域名格式校验之外的复杂校验。
- 不持久化本地"最近操作历史"，每次列表都从 API 实时拉取。
