# SDK Auth Mode Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在主页新增一个独立面板，让用户在 `clientToken` 和 `clientId` 两种 SDK 初始化模式之间切换，所有测试案例自动响应。

**Architecture:** 在 `useEnvStore` 加 `authMode` 字段；新建 `useSdkInitOptions` hook 封装"根据 authMode 拿到 init credentials"的逻辑；新建 `AuthModePanel` 独立卡片组件放在主页；所有测试案例把手动调用 `getBrowserSafeClientToken` 的两行替换成 `const initOptions = await getInitOptions()`。切换 authMode 时复用 `bumpSdkReloadToken` 触发重初始化。

**Tech Stack:** Next.js 16, React 19, Zustand (persist), TypeScript

---

## File Map

| 操作 | 文件 | 职责 |
|------|------|------|
| Modify | `code/types/env.ts` | 加 `AuthMode` 类型和 `EnvState.authMode` |
| Modify | `code/store/useEnvStore.ts` | 加 `authMode`、`setAuthMode` |
| Create | `code/hooks/useSdkInitOptions.ts` | 封装 auth mode → init options 逻辑 |
| Create | `code/components/panels/AuthModePanel.tsx` | 主页独立切换卡片 |
| Modify | `code/app/page.tsx` | 在 EnvPanel 下方插入 AuthModePanel |
| Modify | 33 个测试案例 tsx 文件 | 替换 getBrowserSafeClientToken 调用 |

---

## Task 1: 扩展类型和 Store

**Files:**
- Modify: `code/types/env.ts`
- Modify: `code/store/useEnvStore.ts`

- [ ] **Step 1: 更新 `code/types/env.ts`**

```typescript
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

- [ ] **Step 2: 更新 `code/store/useEnvStore.ts`**

在 `EnvStore` interface 加：
```typescript
setAuthMode: (mode: AuthMode) => void
```

在 `envDefaults` 加：
```typescript
authMode: "clientToken" as AuthMode,
```

在 actions 里加：
```typescript
setAuthMode: (authMode) => set({ authMode }),
```

import 头改为：
```typescript
import type { EnvState, PayPalEnv, AuthMode } from "@/types/env"
```

- [ ] **Step 3: Commit**

```bash
git add code/types/env.ts code/store/useEnvStore.ts
git commit -m "(feat)[2026-05-22] 扩展 EnvStore 支持 authMode 字段"
```

---

## Task 2: 新建 `useSdkInitOptions` hook

**Files:**
- Create: `code/hooks/useSdkInitOptions.ts`

- [ ] **Step 1: 创建 `code/hooks/useSdkInitOptions.ts`**

```typescript
import { useEnvStore } from "@/store/useEnvStore";
import { getBrowserSafeClientToken } from "@/services/paypal-sdk-function/browser-function";

export function useSdkInitOptions() {
  const authMode = useEnvStore((s) => s.authMode);
  const activeClientId = useEnvStore((s) => s.activeClientId());

  async function getInitOptions(): Promise<{ clientToken: string } | { clientId: string }> {
    if (authMode === "clientId") {
      return { clientId: activeClientId };
    }
    const clientToken = await getBrowserSafeClientToken();
    return { clientToken };
  }

  return { getInitOptions, authMode };
}
```

- [ ] **Step 2: Commit**

```bash
git add code/hooks/useSdkInitOptions.ts
git commit -m "(feat)[2026-05-22] 新增 useSdkInitOptions hook"
```

---

## Task 3: 新建 `AuthModePanel` 组件

**Files:**
- Create: `code/components/panels/AuthModePanel.tsx`

- [ ] **Step 1: 创建 `code/components/panels/AuthModePanel.tsx`**

```typescript
"use client";

import { useEnvStore } from "@/store/useEnvStore";
import { Card } from "@/components/ui/Card";
import { unloadPayPalWebSdk } from "@/lib/paypalScript";
import type { AuthMode } from "@/types/env";
import { KeyRound, Coins } from "lucide-react";

export function AuthModePanel() {
  const { authMode, setAuthMode, bumpSdkReloadToken } = useEnvStore();

  const handleModeToggle = (mode: AuthMode) => {
    if (mode === authMode) return;
    unloadPayPalWebSdk();
    setAuthMode(mode);
    bumpSdkReloadToken();
  };

  return (
    <Card className="p-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl -z-10" />

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">🔌</span>
        SDK Init Mode
      </h2>

      <p className="text-sm text-muted-foreground mb-4">
        控制所有测试案例使用哪种方式初始化 PayPal SDK 实例。
      </p>

      <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => handleModeToggle("clientToken")}
          className={`flex items-center gap-2 px-4 py-1.5 transition-colors ${
            authMode === "clientToken"
              ? "bg-purple-600 text-white font-semibold"
              : "bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          <Coins className="w-4 h-4" />
          clientToken
        </button>
        <button
          type="button"
          onClick={() => handleModeToggle("clientId")}
          className={`flex items-center gap-2 px-4 py-1.5 transition-colors ${
            authMode === "clientId"
              ? "bg-purple-600 text-white font-semibold"
              : "bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          clientId
        </button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {authMode === "clientToken"
          ? "clientToken 模式：后端通过 OAuth 换取 access token，传给 createInstance()"
          : "clientId 模式：直接将 clientId 传给 createInstance()，无需后端 token 接口"}
      </p>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add code/components/panels/AuthModePanel.tsx
git commit -m "(feat)[2026-05-22] 新增 AuthModePanel 组件"
```

---

## Task 4: 主页插入 AuthModePanel

**Files:**
- Modify: `code/app/page.tsx`

- [ ] **Step 1: 加 import 并插入组件**

在 page.tsx 顶部 imports 加：
```typescript
import { AuthModePanel } from "@/components/panels/AuthModePanel";
```

在 JSX 里 `<EnvPanel />` 下方加：
```tsx
<AuthModePanel />
```

- [ ] **Step 2: Commit**

```bash
git add code/app/page.tsx
git commit -m "(feat)[2026-05-22] 主页添加 AuthModePanel"
```

---

## Task 5: 重构所有测试案例

**每个文件改动模式相同（Step A/B/C）：**

**Step A** — 加 import（如果文件里没有）：
```typescript
import { useSdkInitOptions } from "@/hooks/useSdkInitOptions";
```

**Step B** — 在组件函数体的 hooks 区加（紧跟 `usePayPalWebSdk` 那行）：
```typescript
const { getInitOptions } = useSdkInitOptions();
```

**Step C** — 在 `useEffect` 里，把：
```typescript
const clientToken = await getBrowserSafeClientToken();
```
和传给 `createInstance` 的 `clientToken` 字段，替换为：
```typescript
const initOptions = await getInitOptions();
```
并把 `createInstance` 的调用改为：
```typescript
const sdkInstance = await paypal?.createInstance?.({
  ...initOptions,
  components: [...],   // 保持原有值不变
  pageType: "...",     // 保持原有值不变
});
```

如果文件中 `getBrowserSafeClientToken` 不再被使用，删除对应 import。

- [ ] **Step 1: 重构 Buttons 组**

按 Step A/B/C 改以下文件：
- `code/app/jsv6-test-cases/buttons/buttons-basic/ButtonBasic.tsx`
- `code/app/jsv6-test-cases/buttons/buttons-styling/ButtonStyling.tsx`
- `code/app/jsv6-test-cases/buttons/bcdc/BCDC.tsx`
- `code/app/jsv6-test-cases/buttons/bcdc-inline/BCDCInline.tsx`
- `code/app/jsv6-test-cases/buttons/custom-button/CustomButton.tsx`
- `code/app/jsv6-test-cases/buttons/venmo/Venmo.tsx`
- `code/app/jsv6-test-cases/buttons/subscriptions/ButtonSubscription.tsx`

- [ ] **Step 2: 重构 PLM 组**

- `code/app/jsv6-test-cases/PLM/BNPLMessaging/PayLaterMessageBasic.tsx`
- `code/app/jsv6-test-cases/PLM/BNPLMessaging-Analytics/PayLaterMessageAnalytics.tsx`
- `code/app/jsv6-test-cases/PLM/BNPLMessaging-dynamic/PayLaterMessageDynamic.tsx`
- `code/app/jsv6-test-cases/PLM/BNPLMessaging-live/PayLaterMessageLive.tsx`
- `code/app/jsv6-test-cases/PLM/pay-later/PayLaterWOEligibleChek.tsx`
- `code/app/jsv6-test-cases/PLM/pay-later/PayLaterWithEligibleCheck.tsx`
- `code/app/jsv6-test-cases/PLM/pay-later-witheligiblecheck/PayLaterEligibleCheck.tsx`
- `code/app/jsv6-test-cases/PLM/pay-later-witheligiblecheck-backend/PayLaterEligibleCheckBackend.tsx`
- `code/app/jsv6-test-cases/PLM/pay-later-custom-button/PayLaterWithCustonButton.tsx`

- [ ] **Step 3: 重构 Advanced 组**

- `code/app/jsv6-test-cases/advanced/ACDC/CardFields.tsx`
- `code/app/jsv6-test-cases/advanced/applePay/ApplePayButton.tsx`
- `code/app/jsv6-test-cases/advanced/googlePay/GooglePayButton.tsx`
- `code/app/jsv6-test-cases/advanced/fastlane/iframeButton.tsx`
- `code/app/jsv6-test-cases/advanced/vault-save-payment/ButtonSavePaymentMethod.tsx`
- `code/app/jsv6-test-cases/advanced/vault-save-with-purchase/ButtonSaveWPurchase.tsx`
- `code/app/jsv6-test-cases/advanced/vault-recurring/ButtonVaultRecurring.tsx`

- [ ] **Step 4: 重构 Browser Display 组**

- `code/app/jsv6-test-cases/browser-display/directAppSwitch/APPSwitch.tsx`
- `code/app/jsv6-test-cases/browser-display/merchantAsyncValidation/MerchantAsyncValidationPattern.tsx`
- `code/app/jsv6-test-cases/browser-display/paymentHandler/paymentHandlerBtn.tsx`
- `code/app/jsv6-test-cases/browser-display/redirect/Redirect.tsx`
- `code/app/jsv6-test-cases/browser-display/sandboxedIframe/iframeButton.tsx`

- [ ] **Step 5: 重构 APM 组**

- `code/app/jsv6-test-cases/APM/bancontact/BancontactPayments.tsx`
- `code/app/jsv6-test-cases/APM/blik/blikPayments.tsx`
- `code/app/jsv6-test-cases/APM/eps/epsPayments.tsx`
- `code/app/jsv6-test-cases/APM/ideal/IdealPayments.tsx`
- `code/app/jsv6-test-cases/APM/p24/p24Payments.tsx`

- [ ] **Step 6: Commit 所有测试案例**

```bash
git add code/app/jsv6-test-cases/
git commit -m "(feat)[2026-05-22] 所有测试案例迁移至 useSdkInitOptions，支持 clientToken/clientId 双模式"
```

---

## Task 6: 验证

- [ ] **Step 1: 启动开发服务器**

```bash
cd code && pnpm dev
```

- [ ] **Step 2: 验证 clientToken 模式（默认）**
  1. 打开主页，确认 `AuthModePanel` 显示，默认选中 `clientToken`
  2. 进入任意测试案例（如 buttons-basic），确认 SDK 正常初始化、按钮渲染
  3. 打开 Network tab，确认有 `/api/paypal/client-token` 请求

- [ ] **Step 3: 切换到 clientId 模式**
  1. 点击主页 `AuthModePanel` 中的 `clientId`
  2. 进入同一测试案例，确认 SDK 正常初始化
  3. Network tab 里不应再有 `/api/paypal/client-token` 请求
  4. 切回 `clientToken`，确认恢复正常

- [ ] **Step 4: 最终 commit**

```bash
git add -A
git commit -m "(feat)[2026-05-22] auth mode switch 功能完成验证"
```
