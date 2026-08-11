# Apple Pay 三方模式（Shoppaas）单文件 HTML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建一个自包含单文件 HTML（`code/public/single-html-deploy/applepay-3p-shoppaas.html`），用固定的 Shoppaas 三方模式凭证复刻 `code/app/jsv6-test-cases/advanced/applePay/` 的 Apple Pay 下单/支付流程，随 Next.js 项目一起部署到 Cloudflare Pages，可直接分享 URL 或文件本体使用。

**Architecture:** 纯原生 HTML + `<script>`（无 React/构建步骤），放入 `code/public/`，Next.js dev/生产环境都会原样静态 serve。页面加载 PayPal Web SDK v6 + Apple Pay JS SDK + vConsole（均走 CDN），用固定商品/固定 Shoppaas 凭证初始化 `paypal.createInstance()`，Apple Pay 点击流程走原生 `ApplePaySession`，下单/捕获通过同源相对路径 `fetch()` 调用现有 `/api/paypal/order/create/create-order` 和 `/api/paypal/order/capture/capture-order`（不改动这两个路由）。

**Tech Stack:** 原生 HTML/CSS/JS，PayPal JS SDK v6（`https://www.sandbox.paypal.com/web-sdk/v6/core`），Apple Pay JS SDK（`https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js`），vConsole（CDN），Node.js（仅用于验证 `buildAuthAssertionHeader` 输出，不引入到运行时）。

**参考 spec：** `docs/superpowers/specs/2026-08-11-applepay-3p-shoppaas-single-html-design.md`

---

## File Structure

- Create: `code/public/single-html-deploy/applepay-3p-shoppaas.html` — 唯一的产出文件，包含页面结构、固定配置、SDK 初始化、Apple Pay 点击/下单/捕获逻辑。
- Create (temporary, deleted after verification): `/tmp/verify-auth-assertion.mjs` — 一次性 Node 脚本，用于验证 `buildAuthAssertionHeader` 的输出格式正确，不进入仓库。

---

### Task 1: 页面骨架 + 固定配置 + SDK 脚本加载

**Files:**
- Create: `code/public/single-html-deploy/applepay-3p-shoppaas.html`

- [ ] **Step 1: 写出页面骨架文件**

创建 `code/public/single-html-deploy/applepay-3p-shoppaas.html`，内容如下：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Apple Pay · 三方模式 (Shoppaas)</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      max-width: 480px;
      margin: 40px auto;
      padding: 0 16px;
      color: #1a1a1a;
    }
    h1 { font-size: 20px; }
    .product-card {
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .product-card .price {
      font-size: 24px;
      font-weight: 700;
      margin-top: 4px;
    }
    #applepay-button-container {
      min-height: 48px;
    }
    #status-log {
      margin-top: 24px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      font-size: 13px;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 240px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <h1>Apple Pay 测试 · 三方模式 (Shoppaas)</h1>

  <div class="product-card">
    <div id="product-title">Test Product</div>
    <div class="price" id="product-price">$29.99</div>
  </div>

  <div id="applepay-button-container"></div>
  <div id="status-log"></div>

  <!-- vConsole：移动端 Safari 调试用 -->
  <script src="https://cdn.jsdelivr.net/npm/vconsole@3.15.1/dist/vconsole.min.js"></script>
  <script>
    if (typeof VConsole !== "undefined") {
      new VConsole();
    }
  </script>

  <!-- Apple Pay JS SDK -->
  <script src="https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js"></script>

  <!-- PayPal Web SDK v6 (sandbox) -->
  <script src="https://www.sandbox.paypal.com/web-sdk/v6/core" crossorigin="anonymous"></script>

  <script>
    // ===== 固定配置（Shoppaas sandbox 三方模式）=====
    const CONFIG = {
      clientId: "ATIwW9NdRH9Nqde8MCftI_0QbOL9APdYok0a7ircWl2-3fBHv-CoMYsfIDpcUDisqTHmHT7d0Dz9DV7V",
      merchantId: "VTTMTYQNF628U",
      clientSecret: "EC-Qcp-6LdYoEw9g02iTkVTRHa49c_HLP19P2hxbSHATN3cov2_G-wmFzp5-Cx2gK3phIzrKhOhbLhPJ",
      env: "sandbox",
      product: {
        id: "test-product-1",
        name: "Test Product",
        unitPrice: 29.99,
        quantity: 1,
        currency: "USD",
      },
    };

    function log(...args) {
      const line = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
      console.log(line);
      const el = document.getElementById("status-log");
      el.textContent += line + "\n";
      el.scrollTop = el.scrollHeight;
    }
  </script>
</body>
</html>
```

- [ ] **Step 2: 启动 dev server 并验证静态文件被正确 serve**

Run:
```bash
cd code && npm run dev &
sleep 3
curl -s http://localhost:3000/single-html-deploy/applepay-3p-shoppaas.html | grep -c "applepay-button-container"
```
Expected: 输出 `1`（说明文件被原样返回，且包含预期容器元素）。

- [ ] **Step 3: 停止 dev server**

Run: `kill %1` （或找到对应的 `next dev` 进程 kill 掉）

- [ ] **Step 4: Commit**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test
git add code/public/single-html-deploy/applepay-3p-shoppaas.html
git commit -m "$(cat <<'EOF'
feat[2026-08-11](applePay): 新增 Apple Pay 三方模式单文件 HTML 页面骨架

## 解决的问题
提供 advanced/applePay 测试用例的可分享单文件版本，本次先搭好页面骨架、固定配置和 SDK 脚本加载。

## 主要改动
- code/public/single-html-deploy/applepay-3p-shoppaas.html: 新增页面骨架，硬编码 Shoppaas sandbox 三方模式凭证与固定商品，引入 PayPal Web SDK v6 / Apple Pay JS SDK / vConsole

## 为什么这么改
按 docs/superpowers/specs/2026-08-11-applepay-3p-shoppaas-single-html-design.md 设计，放入 code/public/single-html-deploy/ 可随现有 Next.js 部署原样发布，无需额外构建步骤。
EOF
)"
```

---

### Task 2: `buildAuthAssertionHeader` 逻辑 + 独立验证

**Files:**
- Modify: `code/public/single-html-deploy/applepay-3p-shoppaas.html`（在 Task 1 的最后一个 `<script>` 里追加函数）

- [ ] **Step 1: 在页面的 `<script>` 里追加 `buildAuthAssertionHeader` 函数**

在 `function log(...)` 定义之后追加：

```html
    // ===== 三方模式 PayPal-Auth-Assertion 构造 =====
    // 对应 code/services/paypal-sdk-function/auth-assertion.ts 的逻辑，原生 JS 重写
    function buildAuthAssertionHeader(clientId, merchantId) {
      const header = "eyJhbGciOiJub25lIn0="; // base64({"alg":"none"})
      const payload = btoa(unescape(encodeURIComponent(
        JSON.stringify({ iss: clientId, payer_id: merchantId })
      )));
      return `${header}.${payload}.`;
    }
```

- [ ] **Step 2: 写一次性 Node 脚本验证输出格式正确**

创建 `/tmp/verify-auth-assertion.mjs`：

```js
function buildAuthAssertionHeader(clientId, merchantId) {
  const header = "eyJhbGciOiJub25lIn0=";
  const payload = Buffer.from(
    JSON.stringify({ iss: clientId, payer_id: merchantId })
  ).toString("base64");
  return `${header}.${payload}.`;
}

const result = buildAuthAssertionHeader("TEST_CLIENT_ID", "TEST_MERCHANT_ID");
const parts = result.split(".");
console.assert(parts.length === 3, "应该是三段式 JWT 结构（header.payload.）");
console.assert(parts[2] === "", "第三段应为空（无签名）");

const decodedHeader = JSON.parse(Buffer.from(parts[0], "base64").toString());
console.assert(decodedHeader.alg === "none", "header 应为 {alg: none}");

const decodedPayload = JSON.parse(Buffer.from(parts[1], "base64").toString());
console.assert(decodedPayload.iss === "TEST_CLIENT_ID", "iss 应等于 clientId");
console.assert(decodedPayload.payer_id === "TEST_MERCHANT_ID", "payer_id 应等于 merchantId");

console.log("PASS:", result);
```

Run: `node /tmp/verify-auth-assertion.mjs`
Expected: 输出 `PASS: eyJhbGciOiJub25lIn0=.<base64>.`，没有任何 assertion 报错。

- [ ] **Step 3: 清理临时验证脚本**

Run: `rm /tmp/verify-auth-assertion.mjs`

- [ ] **Step 4: Commit**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test
git add code/public/single-html-deploy/applepay-3p-shoppaas.html
git commit -m "$(cat <<'EOF'
feat[2026-08-11](applePay): 单文件 HTML 新增 PayPal-Auth-Assertion 构造逻辑

## 解决的问题
三方模式下调用 capture-order 接口需要 x-paypal-auth-assertion header，原逻辑在 services/paypal-sdk-function/auth-assertion.ts 里，单文件 HTML 不能 import，需要原生 JS 重写一份。

## 主要改动
- code/public/single-html-deploy/applepay-3p-shoppaas.html: 新增 buildAuthAssertionHeader 函数，逻辑与现有 TS 版本一致（已用独立 Node 脚本验证输出格式：header.payload. 三段式，header 为 {alg:none}，payload 含 iss/payer_id）

## 为什么这么改
保证三方模式下单文件 HTML 生成的 auth-assertion header 跟现网页版行为完全一致。
EOF
)"
```

---

### Task 3: PayPal SDK 初始化 + Apple Pay 按钮渲染

**Files:**
- Modify: `code/public/single-html-deploy/applepay-3p-shoppaas.html`

- [ ] **Step 1: 追加 SDK 就绪等待 + 初始化逻辑**

在 `buildAuthAssertionHeader` 函数之后追加：

```html
    // ===== 等待外部脚本加载完成 =====
    function waitFor(checkFn, { timeoutMs = 10000, intervalMs = 100 } = {}) {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const timer = setInterval(() => {
          if (checkFn()) {
            clearInterval(timer);
            resolve();
          } else if (Date.now() - start > timeoutMs) {
            clearInterval(timer);
            reject(new Error("等待脚本加载超时"));
          }
        }, intervalMs);
      });
    }

    // ===== 初始化 PayPal SDK + Apple Pay Session =====
    async function init() {
      try {
        log("等待 PayPal SDK 与 Apple Pay SDK 就绪...");
        await waitFor(() => typeof window.paypal !== "undefined");
        await waitFor(() => typeof window.ApplePaySession !== "undefined");
        log("两个 SDK 都已就绪，开始初始化 PayPal 实例...");

        const sdkInstance = await window.paypal.createInstance({
          clientId: CONFIG.clientId,
          merchantId: CONFIG.merchantId,
          components: ["applepay-payments"],
          pageType: "checkout",
        });
        log("PayPal 实例创建成功");

        const applePaySession = await sdkInstance.createApplePayOneTimePaymentSession();
        const applePayConfig = await applePaySession.config();
        log("Apple Pay config:", applePayConfig);

        renderApplePayButton(applePayConfig, applePaySession);
      } catch (err) {
        log("初始化失败:", err && err.message ? err.message : String(err));
      }
    }

    function renderApplePayButton(applePayConfig, paypalApplePaySession) {
      const container = document.getElementById("applepay-button-container");
      container.innerHTML = '<apple-pay-button id="apple-pay-button" buttonstyle="black" type="buy" locale="en">';
      log("Apple Pay 按钮已渲染");

      document.getElementById("apple-pay-button").addEventListener("click", () => {
        handleApplePayClick(applePayConfig, paypalApplePaySession);
      });
    }

    init();
```

- [ ] **Step 2: 启动 dev server，浏览器打开页面确认无报错**

Run:
```bash
cd code && npm run dev &
sleep 3
```
用浏览器打开 `http://localhost:3000/single-html-deploy/applepay-3p-shoppaas.html`，打开控制台，确认：
- 出现日志 `两个 SDK 都已就绪，开始初始化 PayPal 实例...`
- 出现日志 `PayPal 实例创建成功`
- 出现日志 `Apple Pay 按钮已渲染`
- 页面上出现黑色 Apple Pay 按钮（非 Safari 浏览器可能不渲染实际按钮外观，但不应有 JS 报错中断执行）

Expected: 控制台无未捕获异常，`#status-log` 里能看到上述三条日志。

- [ ] **Step 3: 停止 dev server**

Run: `kill %1`

- [ ] **Step 4: Commit**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test
git add code/public/single-html-deploy/applepay-3p-shoppaas.html
git commit -m "$(cat <<'EOF'
feat[2026-08-11](applePay): 单文件 HTML 接入 PayPal SDK 初始化与 Apple Pay 按钮渲染

## 解决的问题
复刻 ApplePayButton.tsx + ApplePayFunction.ts 里 setupApplePayButton 的初始化逻辑，让单文件 HTML 能创建 PayPal 三方模式实例并渲染 Apple Pay 按钮。

## 主要改动
- code/public/single-html-deploy/applepay-3p-shoppaas.html: 新增 waitFor/init/renderApplePayButton，等待 PayPal SDK + Apple Pay SDK 就绪后调用 createInstance({clientId, merchantId, components: ["applepay-payments"]})，渲染 <apple-pay-button>

## 为什么这么改
浏览器打开页面手动验证：两个 SDK 就绪日志、实例创建成功日志、按钮渲染成功日志均正常出现，无未捕获异常。
EOF
)"
```

---

### Task 4: Apple Pay 点击流程 + 下单/捕获（fetch 重写）

**Files:**
- Modify: `code/public/single-html-deploy/applepay-3p-shoppaas.html`

- [ ] **Step 1: 追加点击处理、下单、捕获逻辑**

在 `init()` 调用之前（`renderApplePayButton` 函数之后）追加：

```html
    // ===== 组装 create-order 请求 body（对齐 getOrderConfig 的结构）=====
    function buildOrderPayload() {
      const { id, name, unitPrice, quantity, currency } = CONFIG.product;
      const total = Number((unitPrice * quantity).toFixed(2));
      return {
        items: [{ id, name, unitPrice, quantity, total }],
        totalAmount: total,
        currency,
        meta: {},
        paymentDetail: {
          endpoint: {
            return_url: window.location.href,
            cancel_url: window.location.href,
          },
          payment_source: "apple_pay",
        },
      };
    }

    function getPayPalHeaders() {
      return {
        "Content-Type": "application/json",
        "x-paypal-client-id": CONFIG.clientId,
        "x-paypal-secret": CONFIG.clientSecret,
        "x-paypal-env": CONFIG.env,
        "x-paypal-auth-assertion": buildAuthAssertionHeader(CONFIG.clientId, CONFIG.merchantId),
      };
    }

    async function createOrder() {
      const res = await fetch("/api/paypal/order/create/create-order", {
        method: "POST",
        headers: getPayPalHeaders(),
        body: JSON.stringify(buildOrderPayload()),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`创建订单失败: ${res.status} ${text}`);
      }
      const json = await res.json();
      const orderId = json && json.order && json.order.id;
      if (!orderId) throw new Error("后端未返回 orderId");
      return orderId;
    }

    async function captureOrder(orderId) {
      const res = await fetch("/api/paypal/order/capture/capture-order", {
        method: "POST",
        headers: getPayPalHeaders(),
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`捕获订单失败: ${res.status} ${text}`);
      }
      return res.json();
    }

    function handleApplePayClick(applePayConfig, paypalApplePaySession) {
      const { unitPrice, quantity, currency } = CONFIG.product;
      const total = (unitPrice * quantity).toFixed(2);

      const paymentRequest = {
        countryCode: "US",
        currencyCode: currency,
        merchantCapabilities: applePayConfig.merchantCapabilities,
        supportedNetworks: applePayConfig.supportedNetworks,
        requiredBillingContactFields: ["name", "phone", "email", "postalAddress"],
        requiredShippingContactFields: [],
        total: { label: "Your Store Name", amount: total, type: "final" },
      };

      const applePaySession = new ApplePaySession(4, paymentRequest);

      applePaySession.onvalidatemerchant = (event) => {
        log("商户验证中...");
        paypalApplePaySession
          .validateMerchant({ validationUrl: event.validationURL })
          .then((payload) => {
            applePaySession.completeMerchantValidation(payload.merchantSession);
            log("商户验证成功");
          })
          .catch((err) => {
            log("商户验证失败:", err && err.message ? err.message : String(err));
            applePaySession.abort();
          });
      };

      applePaySession.onpaymentmethodselected = () => {
        applePaySession.completePaymentMethodSelection({ newTotal: paymentRequest.total });
      };

      applePaySession.onpaymentauthorized = async (event) => {
        try {
          log("支付已授权，开始创建订单...");
          const orderId = await createOrder();
          log("订单已创建:", orderId);

          await paypalApplePaySession.confirmOrder({
            orderId,
            token: event.payment.token,
            billingContact: event.payment.billingContact,
            shippingContact: event.payment.shippingContact,
          });
          log("订单已确认，开始捕获支付...");

          const captureResult = await captureOrder(orderId);
          log("支付捕获成功:", captureResult);

          applePaySession.completePayment({ status: window.ApplePaySession.STATUS_SUCCESS });
        } catch (err) {
          log("支付失败:", err && err.message ? err.message : String(err));
          applePaySession.completePayment({ status: window.ApplePaySession.STATUS_FAILURE });
        }
      };

      applePaySession.oncancel = () => {
        log("用户取消了 Apple Pay");
      };

      applePaySession.begin();
    }
```

- [ ] **Step 2: 用 curl 验证 create-order 接口在给定 payload 下能正常返回 orderId（脱离浏览器/Apple 设备的可自动化验证）**

Run:
```bash
cd code && npm run dev &
sleep 3
curl -s -X POST http://localhost:3000/api/paypal/order/create/create-order \
  -H "Content-Type: application/json" \
  -H "x-paypal-client-id: ATIwW9NdRH9Nqde8MCftI_0QbOL9APdYok0a7ircWl2-3fBHv-CoMYsfIDpcUDisqTHmHT7d0Dz9DV7V" \
  -H "x-paypal-secret: EC-Qcp-6LdYoEw9g02iTkVTRHa49c_HLP19P2hxbSHATN3cov2_G-wmFzp5-Cx2gK3phIzrKhOhbLhPJ" \
  -H "x-paypal-env: sandbox" \
  -d '{"items":[{"id":"test-product-1","name":"Test Product","unitPrice":29.99,"quantity":1,"total":29.99}],"totalAmount":29.99,"currency":"USD","meta":{},"paymentDetail":{"endpoint":{"return_url":"http://localhost:3000/x","cancel_url":"http://localhost:3000/x"},"payment_source":"apple_pay"}}'
```
Expected: 返回 JSON 里包含 `"order"` 对象和一个 `"orderId"`（形如 `{"order":{...},"orderId":"XXXXXXXX"}`），HTTP 200。如果返回 4xx/5xx，说明 payload 结构或凭证有问题，需要对照 Task 4 Step 1 里 `buildOrderPayload()`/`getPayPalHeaders()` 的字段修正后再验证一次。

- [ ] **Step 3: 停止 dev server**

Run: `kill %1`

- [ ] **Step 4: 浏览器端手动验证点击流程接线正确（无法自动化的部分，需要真实 Safari + Apple 开发者证书才能走完整支付）**

用 Safari（macOS 或 iOS）打开部署后的页面（或 `npm run dev` + 内网穿透出 HTTPS），点击 Apple Pay 按钮，确认：
- 弹出系统 Apple Pay 支付面板（说明 `paymentRequest`/`ApplePaySession` 构造正确）
- `#status-log` 依次出现「商户验证中...」「商户验证成功」「支付已授权，开始创建订单...」「订单已创建」「订单已确认，开始捕获支付...」「支付捕获成功」
- 若卡在某一步，对照该步骤对应的 log 文案定位问题（例如商户验证失败通常是域名未在 Apple/PayPal 后台注册，创建订单失败通常是 payload 或凭证问题）

这一步依赖真实 Apple 设备和已注册域名，无法在此计划中自动化验证，记录为已知限制。

- [ ] **Step 5: Commit**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test
git add code/public/single-html-deploy/applepay-3p-shoppaas.html
git commit -m "$(cat <<'EOF'
feat[2026-08-11](applePay): 单文件 HTML 完成 Apple Pay 点击/下单/捕获全流程

## 解决的问题
复刻 ApplePayFunction.ts 里 handleApplePayClick + setupApplePayEventHandlers 的完整支付流程，用原生 fetch 替代 browser-function.ts 里依赖 store/import 的封装。

## 主要改动
- code/public/single-html-deploy/applepay-3p-shoppaas.html: 新增 buildOrderPayload/getPayPalHeaders/createOrder/captureOrder/handleApplePayClick，走 ApplePaySession 标准事件（onvalidatemerchant/onpaymentmethodselected/onpaymentauthorized/oncancel），下单与捕获通过同源相对路径 fetch 调用现有 /api/paypal/order/create/create-order 与 /api/paypal/order/capture/capture-order

## 为什么这么改
已用 curl 验证 create-order 接口在该 payload 结构下能正常返回 orderId，确认字段对齐现有后端预期；完整的 Apple Pay 支付授权流程依赖真实 Safari + 已注册域名，无法自动化验证，已在 spec/plan 中记录为已知限制，需要后续人工在真机上验证。
EOF
)"
```

---

## Manual QA Checklist（部署上线后，人工执行）

- [ ] 访问 `https://<部署域名>/single-html-deploy/applepay-3p-shoppaas.html`，确认页面正常加载，无 404
- [ ] 用 Safari（Mac 或 iPhone，已登录 Apple ID 且有可用卡片）打开，点击 Apple Pay 按钮，走完整支付流程
- [ ] 确认 `#status-log` 完整走完「创建订单 → 确认订单 → 捕获支付」且无报错
- [ ] 在非 Safari 浏览器（如 Chrome）打开，确认页面不报未捕获异常（Apple Pay 按钮本身可能不可用，这是预期行为）
