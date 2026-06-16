# 全局错误对话框（find-eligible-methods）

**日期**：2026-06-16
**作者**：petro / Claude

## 背景

项目里有 22 个 test scenario 在初始化时调用 `sdkInstance.findEligibleMethods(...)`，当前实现把异常静默吞在 `catch` 里只 `consola.error(...)`。当凭证没权限/参数错时（通常是 PayPal 返回 400），用户看不到任何 UI 提示，只能去开 devtools 才能定位。

报错信息可能很长（PayPal 会带 `name` / `message` / `debug_id` / `details` / `links` 等字段），用 toast 不合适 —— 需要一个可承载多行 + 可滚动 + 可复制的对话框。

## 目标

- 做一个**通用的全局错误对话框**（zustand store + 单点挂载在 layout）。
- 第一阶段只接入 `findEligibleMethods` 的失败路径；其他现在用 toast 的地方**保持不变**。
- 接入方式：封装一个 `safeFindEligibleMethods` 工具函数替换原来的直接调用，把 22 个 scenario 改成统一模式。

## 非目标

- 不为后续 `capture`/`createOrder` 等接入对话框（虽然底层组件可复用，但本次不动）。
- 不做 retry 按钮、错误分类图标、错误上报等。
- 不重构现有 catch 块里的其它逻辑。

## 架构

```
[scenario]
   └─ await safeFindEligibleMethods(sdkInstance, { currencyCode: "PLN" })
         ├─ try → sdkInstance.findEligibleMethods(...)
         │     └─ 成功：返回 paymentMethods，正常往下走
         └─ catch (err)
               ├─ consola.error("findEligibleMethods failed:", err)
               ├─ useErrorDialogStore.getState().show({ title, message, details })
               └─ 返回 null  ← 让 caller 用 `if (!paymentMethods) return;` 早退

[layout.tsx]
   └─ <GlobalErrorDialog />  ← 单点挂载，订阅 store
```

## 新增文件

### 1. `code/store/useErrorDialogStore.ts`

Zustand store。状态形状：

```ts
interface ErrorDialogState {
  open: boolean;
  title: string;
  message: string;
  details: unknown;  // 任意类型，UI 自己 JSON.stringify
  show: (payload: { title: string; message: string; details?: unknown }) => void;
  hide: () => void;
}
```

不需要 persist —— 错误状态本来就是临时的。

### 2. `code/components/ui/GlobalErrorDialog.tsx`

基于 `@/components/ui/alert-dialog`（项目里已有的 shadcn 组件）。订阅 store 渲染。

UI 结构：

```
┌──────────────────────────────────────────────┐
│ ⚠  Find Eligible Methods Failed              │  ← title
├──────────────────────────────────────────────┤
│ {err.message}                                │  ← message（简短主信息）
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ ▾ Details                          [📋]  │ │  ← 折叠区（默认展开） + 复制按钮
│ │ {                                        │ │
│ │   "name": "PERMISSION_DENIED",           │ │
│ │   "message": "...",                      │ │
│ │   "debug_id": "abc123",                  │ │
│ │   ...                                    │ │
│ │ }                                        │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│                              [ Close ]       │
└──────────────────────────────────────────────┘
```

实现要点：
- **简短主信息**：`message` 字段直接渲染。
- **Details 区**：默认**展开**。内容 = `JSON.stringify(details, null, 2)`，用 `<pre>` 包，带 `max-height: 60vh` + `overflow-y-auto`。
- **复制按钮**：把 details 的 JSON 字符串复制到剪贴板，复制后用一个简短反馈（图标变化 / "Copied!" 文本）。
- **单按钮 Close**：点击调用 `hide()`。
- **图标**：用 `lucide-react` 的 `AlertCircle` 或 `AlertTriangle`，红色。

不要做的：
- 不做 retry。
- 不做错误分类（一律 warning 红色 + ⚠ 图标）。
- 不做错误类型推断（如区分 4xx/5xx）。

### 3. `code/services/paypal-sdk-function/safe-find-eligible-methods.ts`

（文件名走 kebab，和同目录的 `browser-function.ts` / `order-utils.ts` / `paypal-headers.ts` 一致。导出函数仍叫 `safeFindEligibleMethods`。）

工具函数。签名：

```ts
import consola from "consola";
import { useErrorDialogStore } from "@/store/useErrorDialogStore";

export async function safeFindEligibleMethods(
  sdkInstance: any,
  params: any,
): Promise<any | null> {
  try {
    return await sdkInstance.findEligibleMethods(params);
  } catch (err: any) {
    consola.error("findEligibleMethods failed:", err);
    useErrorDialogStore.getState().show({
      title: "Find Eligible Methods Failed",
      message: err?.message ?? String(err),
      details: err,
    });
    return null;
  }
}
```

返回 `null` 而不是 rethrow —— 让 caller 用 `if (!paymentMethods) return;` 早退，外层 `try/catch` 不会被这条错误重复处理。

## 修改文件

### `code/app/layout.tsx`

在 `<Toaster />` 旁边加一行：

```tsx
<GlobalErrorDialog />
```

### 22 个 scenario 文件

统一改法：

```diff
- const paymentMethods = await sdkInstance.findEligibleMethods({
-     currencyCode: "PLN",
- });
+ const paymentMethods = await safeFindEligibleMethods(sdkInstance, {
+     currencyCode: "PLN",
+ });
+ if (!paymentMethods) return;
```

清单（22 个）：

**APM (6)**：
- `app/jsv6-test-cases/APM/sepa/sepaPayments.tsx`
- `app/jsv6-test-cases/APM/ideal/IdealPayments.tsx`
- `app/jsv6-test-cases/APM/bancontact/BancontactPayments.tsx`
- `app/jsv6-test-cases/APM/blik/blikPayments.tsx`
- `app/jsv6-test-cases/APM/eps/epsPayments.tsx`
- `app/jsv6-test-cases/APM/p24/p24Payments.tsx`

**buttons (8)**：
- `app/jsv6-test-cases/buttons/buttons-basic/ButtonBasic.tsx`
- `app/jsv6-test-cases/buttons/bcdc/BCDC.tsx`
- `app/jsv6-test-cases/buttons/bcdc-inline/BCDCInline.tsx`
- `app/jsv6-test-cases/buttons/bcdc-inline-autostart/BCDCInlineAutoStart.tsx`
- `app/jsv6-test-cases/buttons/bcdc-inline-with-email/BCDCInlineEmail.tsx`
- `app/jsv6-test-cases/buttons/venmo/Venmo.tsx`
- `app/jsv6-test-cases/buttons/subscriptions/ButtonSubscription.tsx`
- `app/jsv6-test-cases/buttons/custom-button/CustomButton.tsx`

**PLM (3)**：
- `app/jsv6-test-cases/PLM/pay-later/PayLaterWOEligibleChek.tsx`
- `app/jsv6-test-cases/PLM/pay-later-witheligiblecheck/PayLaterEligibleCheck.tsx`
- `app/jsv6-test-cases/PLM/pay-later-witheligiblecheck-backend/PayLaterEligibleCheckBackend.tsx`

**advanced (4)**：
- `app/jsv6-test-cases/advanced/ACDC/CardFields.tsx`
- `app/jsv6-test-cases/advanced/vault-save-payment/ButtonSavePaymentMethod.tsx`
- `app/jsv6-test-cases/advanced/vault-recurring/ButtonVaultRecurring.tsx`
- `app/jsv6-test-cases/advanced/vault-save-with-purchase/ButtonSaveWPurchase.tsx`

**browser-display (1)**：
- `app/jsv6-test-cases/browser-display/merchantAsyncValidation/MerchantAsyncValidationPattern.tsx`

## 副作用 / 边界

- **EligibilityOverlay 关闭**：22 个 scenario 中绝大多数在 `finally` 里 `setIsInitializing(false)`，所以早退 `return` 后 overlay 会自然关闭，不需要额外处理。实施时要逐一确认这一点。
- **`cancelled` 标志**：早退后 useEffect 的 cleanup 函数仍会触发 `cancelled = true`，原有逻辑不受影响。
- **dialog 同时弹多次**：如果两个 scenario 切换得快，store 会被最后一次 `show()` 覆盖。这是可接受的 —— 一次只显示一个错误，最新的会盖掉旧的。

## 测试方式

- 切到一个**没有 SEPA 权限**的凭证（比如默认的 US Acct），打开 SEPA scenario 页面，应该看到对话框弹出，显示 PayPal 返回的 400 错误详情。
- 切到 C2 Acct，重新打开 SEPA scenario，对话框不应该出现，正常渲染 SEPA 表单。
- 在对话框上点 Copy 按钮，确认 JSON 被复制到剪贴板。
- 关闭对话框后，切到下一个 scenario，store 状态被重置。
