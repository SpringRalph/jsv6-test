# Apple Pay 三方模式（Shoppaas）单文件 HTML 测试页

## 背景

`code/app/jsv6-test-cases/advanced/applePay/` 是一个基于 React/Next.js 的 Apple Pay 测试用例，依赖 SDK 配置面板、购物车 store、环境切换等一整套项目基础设施，无法单独拿出去分享。

需要一个固定使用 Shoppaas 三方（partner）模式凭证的自包含单文件 HTML 版本，方便直接分享给他人测试，不需要对方接触整个项目。

## 部署

复用 [[single-html-static-deploy]] 约定：文件放在 `code/public/single-html-deploy/applepay-3p-shoppaas.html`，随 Next.js 项目一起部署到 Cloudflare Pages，访问路径为 `https://<域名>/single-html-deploy/applepay-3p-shoppaas.html`。

因为与现有 `/api/paypal/order/create/create-order`、`/api/paypal/order/capture/capture-order` 这两个 API 路由同源，页面内用相对路径 `fetch()` 即可，**不需要改动任何现有后端代码，也不需要加 CORS**。

## 固定配置（硬编码，不做可切换面板）

来源：`code/components/panels/SdkConfigPanel.tsx`、`code/store/useEnvStore.ts`（sandbox 环境）。

- `clientId`（Shoppaas partner client-id）：`ATIwW9NdRH9Nqde8MCftI_0QbOL9APdYok0a7ircWl2-3fBHv-CoMYsfIDpcUDisqTHmHT7d0Dz9DV7V`
- `merchantId`（PayPal-Auth-Assertion 用）：`VTTMTYQNF628U`
- `clientSecret`（仅用于拼 `x-paypal-secret` header 传给我们自己的后端）：`EC-Qcp-6LdYoEw9g02iTkVTRHa49c_HLP19P2hxbSHATN3cov2_G-wmFzp5-Cx2gK3phIzrKhOhbLhPJ`
- 商品：固定写死 `Test Product`，单价 `29.99 USD`，无购物车/数量选择

**已知风险**：secret 硬编码进单文件，比现有网页版更容易被复制转发。用户已确认可接受（sandbox 测试账号）。

## 脚本加载

- PayPal Web SDK v6（sandbox）：`https://www.sandbox.paypal.com/web-sdk/v6/core`
- Apple Pay JS SDK：`https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js`
- vConsole（CDN 引入，如 jsdelivr/unpkg），用于移动端 Safari 调试

## 初始化 & 支付流程

1. 等待 PayPal SDK 与 Apple Pay SDK 都加载完成后：
   ```js
   const sdkInstance = await paypal.createInstance({
     clientId, merchantId,
     components: ["applepay-payments"],
     pageType: "checkout",
   });
   const session = await sdkInstance.createApplePayOneTimePaymentSession();
   const config = await session.config();
   ```
2. 渲染 `<apple-pay-button>`，点击后：
   ```js
   const paymentRequest = {
     countryCode: "US", currencyCode: "USD",
     merchantCapabilities: config.merchantCapabilities,
     supportedNetworks: config.supportedNetworks,
     requiredBillingContactFields: ["name", "phone", "email", "postalAddress"],
     requiredShippingContactFields: [],
     total: { label: "Your Store Name", amount: "29.99", type: "final" },
   };
   const applePaySession = new ApplePaySession(4, paymentRequest);
   ```
3. `onvalidatemerchant` → `session.validateMerchant({ validationUrl })`（走 PayPal SDK 内部，不经过我们后端）。
4. `onpaymentauthorized`：
   - `fetch("/api/paypal/order/create/create-order", {...})` 用固定商品/金额组装 body，带 `x-paypal-client-id`/`x-paypal-secret`/`x-paypal-env: sandbox` header，拿到 `orderId`
   - `session.confirmOrder({ orderId, token: event.payment.token, billingContact, shippingContact })`
   - `fetch("/api/paypal/order/capture/capture-order", {...})`，额外带 `x-paypal-auth-assertion` header（三方模式必须）
   - 成功 → `applePaySession.completePayment(ApplePaySession.STATUS_SUCCESS)`；失败 → `STATUS_FAILURE`

### x-paypal-auth-assertion 构造（原生 JS 重写，无 import）

对应 `services/paypal-sdk-function/auth-assertion.ts` 的逻辑：
```js
function buildAuthAssertionHeader(clientId, merchantId) {
  const header = "eyJhbGciOiJub25lIn0="; // base64({"alg":"none"})
  const payload = btoa(unescape(encodeURIComponent(
    JSON.stringify({ iss: clientId, payer_id: merchantId })
  )));
  return `${header}.${payload}.`;
}
```

## 明确不做的东西

- 不做环境/凭证切换面板（SdkConfigPanel 的能力）
- 不做购物车数量选择（CartSummary/useCartStore 的能力）
- 不做 Apple Pay 域名注册面板（域名关联是域名级别的，现有部署已注册过，同域名下新页面无需重复注册）

## 为什么这么改

- 同源部署 + 相对路径 fetch，是让单文件 HTML 复用现有后端签名/下单逻辑、同时避免自己起服务器或改动现有 API 的最简方案。
- 直连 PayPal 官方 API（Orders v2 / oauth2 token）从纯前端不可行——PayPal 不会对携带 secret 的接口开放任意来源 CORS，这条路径已确认走不通，所以必须经过我们自己的 Next.js API 路由中转。
- 硬编码固定配置和固定商品，是因为这个文件的用途是"分享出去让别人快速测试一个具体场景"，不是要做成通用工具，可调选项反而增加维护成本和误用可能。
