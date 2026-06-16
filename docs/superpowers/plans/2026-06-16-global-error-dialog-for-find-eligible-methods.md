# Global Error Dialog for find-eligible-methods Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 22 个 test scenario 里 `findEligibleMethods` 的静默错误改成可视的全局对话框，让用户能看到 PayPal 返回的完整错误（典型是凭证没权限的 400）。

**Architecture:** 单点的 zustand store (`useErrorDialogStore`) + 挂在 `layout.tsx` 的 `<GlobalErrorDialog />` 组件 + 工具函数 `safeFindEligibleMethods(sdkInstance, params?)` —— 内部 try/catch 失败时调 store 弹对话框并返回 `null`，让 caller 用 `if (!paymentMethods) return;` 早退。22 个 scenario 做相同模式的替换。

**Tech Stack:** Next.js 16 · React 19 · Zustand · TailwindCSS v4 · `@radix-ui/react-alert-dialog`（已有的 shadcn `alert-dialog`）· `lucide-react` · `pnpm`

**Notes:**
- 项目里没有 test 框架（package.json 没 test/jest/vitest）。每个任务用**手动验证**作为通过判据。
- 工作目录是 `code/`（项目根是 `code/` 的父目录），所有相对路径都以 `code/` 起。

---

## File Structure

**新建（3 个）：**
- `code/store/useErrorDialogStore.ts` —— Zustand store，承载对话框开关 + 内容
- `code/components/ui/GlobalErrorDialog.tsx` —— 订阅 store 的渲染组件，基于已有的 `alert-dialog`
- `code/services/paypal-sdk-function/safe-find-eligible-methods.ts` —— 包一层 `findEligibleMethods`，捕获异常 → 弹对话框 → 返回 null

**修改（1 个 + 22 个 scenario）：**
- `code/app/layout.tsx` —— 在 `<Toaster />` 旁挂一行 `<GlobalErrorDialog />`
- 22 个 scenario 文件，每个做一处 import 增加 + 一处调用替换 + 一行早退

---

## Task 1: 创建 useErrorDialogStore

**Files:**
- Create: `code/store/useErrorDialogStore.ts`

- [ ] **Step 1: 创建 store 文件**

写入 `code/store/useErrorDialogStore.ts` 的完整内容：

```ts
"use client";

import { create } from "zustand";

interface ShowPayload {
  title: string;
  message: string;
  details?: unknown;
}

interface ErrorDialogState {
  open: boolean;
  title: string;
  message: string;
  details: unknown;
  show: (payload: ShowPayload) => void;
  hide: () => void;
}

export const useErrorDialogStore = create<ErrorDialogState>((set) => ({
  open: false,
  title: "",
  message: "",
  details: undefined,
  show: ({ title, message, details }) =>
    set({ open: true, title, message, details }),
  hide: () => set({ open: false }),
}));
```

- [ ] **Step 2: TypeScript 编译检查**

Run（在 repo 根目录）:
```bash
cd code && pnpm exec tsc --noEmit
```
Expected: 通过，无与新文件相关的错误。

- [ ] **Step 3: Commit**

```bash
git add code/store/useErrorDialogStore.ts
git commit -m "$(cat <<'EOF'
feat[2026-06-16]: 新增 useErrorDialogStore 全局错误对话框状态

## 解决的问题
即将引入的全局错误对话框需要一个跨页面的状态源，作为后续 GlobalErrorDialog
组件 + safeFindEligibleMethods 工具函数共用的入口。

## 主要改动
- code/store/useErrorDialogStore.ts: 新建 zustand store，承载
  { open, title, message, details } + show/hide 方法。

## 为什么这么改
项目已用 zustand（useEnvStore / useButtonStyleStore / useCartStore），保持一致。
不 persist，因为错误状态本身是临时的。
EOF
)"
```

---

## Task 2: 创建 GlobalErrorDialog 组件

**Files:**
- Create: `code/components/ui/GlobalErrorDialog.tsx`

- [ ] **Step 1: 创建组件文件**

写入 `code/components/ui/GlobalErrorDialog.tsx` 的完整内容：

```tsx
"use client";

import { useState } from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useErrorDialogStore } from "@/store/useErrorDialogStore";

function serializeDetails(details: unknown): string {
  if (details === undefined || details === null) return "";
  if (details instanceof Error) {
    const obj: Record<string, unknown> = {
      name: details.name,
      message: details.message,
      stack: details.stack,
    };
    for (const key of Object.keys(details)) {
      (obj as any)[key] = (details as any)[key];
    }
    return JSON.stringify(obj, null, 2);
  }
  if (typeof details === "string") return details;
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

export function GlobalErrorDialog() {
  const open = useErrorDialogStore((s) => s.open);
  const title = useErrorDialogStore((s) => s.title);
  const message = useErrorDialogStore((s) => s.message);
  const details = useErrorDialogStore((s) => s.details);
  const hide = useErrorDialogStore((s) => s.hide);

  const [copied, setCopied] = useState(false);

  const detailsString = serializeDetails(details);
  const hasDetails = detailsString.length > 0;

  const handleCopy = async () => {
    if (!detailsString) return;
    try {
      await navigator.clipboard.writeText(detailsString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板权限被拒绝时静默；用户仍可手动选中复制
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) hide();
      }}
    >
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span>{title || "Error"}</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="break-words text-foreground">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasDetails && (
          <details open className="rounded-md border border-border bg-muted/40">
            <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm font-medium select-none">
              <span>Details</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCopy();
                }}
                className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted transition-colors"
                aria-label="Copy details"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </summary>
            <pre className="max-h-[60vh] overflow-auto border-t border-border bg-background p-3 text-xs font-mono whitespace-pre-wrap break-all">
              {detailsString}
            </pre>
          </details>
        )}

        <AlertDialogFooter>
          <AlertDialogAction onClick={hide}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 2: TypeScript 编译检查**

Run:
```bash
cd code && pnpm exec tsc --noEmit
```
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add code/components/ui/GlobalErrorDialog.tsx
git commit -m "$(cat <<'EOF'
feat[2026-06-16]: 新增 GlobalErrorDialog 错误对话框组件

## 解决的问题
需要一个统一的、能承载多行错误详情（PayPal 返回的 name/message/debug_id 等）
的弹窗，配合 useErrorDialogStore 作为后续 safeFindEligibleMethods 的 UI 出口。

## 主要改动
- code/components/ui/GlobalErrorDialog.tsx: 新增组件。基于已有 shadcn alert-dialog。
  - 头部 ⚠ 图标 + title；正文渲染 message
  - Details 折叠区（默认展开），内容是 JSON.stringify(details, null, 2)
  - max-height + overflow scroll；右上角 Copy 按钮复制 JSON
  - 单按钮 Close

## 为什么这么改
复用项目已有的 alert-dialog 而不是自己实现一套。Details 用 <details open>
原生折叠语义，按需收起，不引入额外状态。
EOF
)"
```

---

## Task 3: 把 GlobalErrorDialog 挂到 layout.tsx

**Files:**
- Modify: `code/app/layout.tsx`

- [ ] **Step 1: 替换 layout.tsx 的 import + body**

把 `code/app/layout.tsx` 的当前内容：

```tsx
import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { EnvBody } from "@/components/layout/EnvBody";
import { Toaster } from "react-hot-toast";
```

改为：

```tsx
import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { EnvBody } from "@/components/layout/EnvBody";
import { Toaster } from "react-hot-toast";
import { GlobalErrorDialog } from "@/components/ui/GlobalErrorDialog";
```

然后把 body 里的：

```tsx
<EnvBody>
    <Navbar />
    <main className="min-h-screen">{children}</main>
    <Toaster position="top-center" />
</EnvBody>
```

改为：

```tsx
<EnvBody>
    <Navbar />
    <main className="min-h-screen">{children}</main>
    <Toaster position="top-center" />
    <GlobalErrorDialog />
</EnvBody>
```

- [ ] **Step 2: TypeScript 编译检查**

Run:
```bash
cd code && pnpm exec tsc --noEmit
```
Expected: 通过。

- [ ] **Step 3: 浏览器自检（可选但推荐）**

Run（如果 dev server 还没起）:
```bash
cd code && pnpm dev
```

打开 http://localhost:3000 任意页面，开 devtools console 执行：
```js
// 临时手动触发一次，验证对话框能弹
window.__pp_test_err = () => {
  // store 没暴露到 window 上，可以借助 React DevTools 查看是否挂载了 GlobalErrorDialog 节点
};
```

或更直接：浏览页面源码（Elements 面板）确认 body 末尾有 `<div data-slot="alert-dialog">` 类的节点（即使关闭，radix 也会挂一个 placeholder）。

也可以临时在 console 里：
```js
// 找到 GlobalErrorDialog 的 portal，看到挂载即可
document.querySelectorAll('[data-slot^="alert-dialog"]').length
```
Expected: 至少 1（EnvPanel 里原有的 live confirm 也用 radix；新增后应该 ≥ 2 元素，但即使是 1 也是因为对话框 closed 不渲染）。

如果浏览器自检不方便，跳过这一步——下一个 task 会真正用上。

- [ ] **Step 4: Commit**

```bash
git add code/app/layout.tsx
git commit -m "$(cat <<'EOF'
feat[2026-06-16]: layout 挂载 GlobalErrorDialog

## 解决的问题
GlobalErrorDialog 需要单点挂载才能被任意页面通过 useErrorDialogStore 触发。

## 主要改动
- code/app/layout.tsx: import GlobalErrorDialog, 在 <Toaster /> 后面渲染一份。
EOF
)"
```

---

## Task 4: 创建 safeFindEligibleMethods 工具函数

**Files:**
- Create: `code/services/paypal-sdk-function/safe-find-eligible-methods.ts`

- [ ] **Step 1: 创建工具文件**

写入 `code/services/paypal-sdk-function/safe-find-eligible-methods.ts` 的完整内容：

```ts
import consola from "consola";
import { useErrorDialogStore } from "@/store/useErrorDialogStore";

/**
 * 包一层 sdkInstance.findEligibleMethods：
 * - 成功：返回原始结果
 * - 失败：consola.error + 弹全局错误对话框 + 返回 null
 *
 * caller 用法：
 *   const paymentMethods = await safeFindEligibleMethods(sdkInstance, { currencyCode: "EUR" });
 *   if (!paymentMethods) return;
 */
export async function safeFindEligibleMethods(
  sdkInstance: any,
  params?: any,
): Promise<any | null> {
  try {
    return params === undefined
      ? await sdkInstance.findEligibleMethods()
      : await sdkInstance.findEligibleMethods(params);
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

- [ ] **Step 2: TypeScript 编译检查**

Run:
```bash
cd code && pnpm exec tsc --noEmit
```
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add code/services/paypal-sdk-function/safe-find-eligible-methods.ts
git commit -m "$(cat <<'EOF'
feat[2026-06-16]: 新增 safeFindEligibleMethods 工具函数

## 解决的问题
22 个 test scenario 在 catch 里只 console.error 吞掉 findEligibleMethods 的报错。
需要一个集中入口，让所有调用点统一获得「失败弹全局对话框 + 返回 null」的行为。

## 主要改动
- code/services/paypal-sdk-function/safe-find-eligible-methods.ts: 新增工具函数。
  - try: 透传 sdkInstance.findEligibleMethods(params?)
  - catch: consola.error + useErrorDialogStore.show + return null
  - params 可选，兼容现有有些 scenario 不传参的写法（PayLater）

## 为什么这么改
返回 null 而不是 rethrow——让 caller 用 `if (!paymentMethods) return;` 早退，
避免外层 catch 重复处理同一错误。
EOF
)"
```

---

## Task 5: 替换 APM 目录 6 个 scenario

**Files:**
- Modify: `code/app/jsv6-test-cases/APM/sepa/sepaPayments.tsx`
- Modify: `code/app/jsv6-test-cases/APM/ideal/IdealPayments.tsx`
- Modify: `code/app/jsv6-test-cases/APM/bancontact/BancontactPayments.tsx`
- Modify: `code/app/jsv6-test-cases/APM/blik/blikPayments.tsx`
- Modify: `code/app/jsv6-test-cases/APM/eps/epsPayments.tsx`
- Modify: `code/app/jsv6-test-cases/APM/p24/p24Payments.tsx`

**统一改动模式**（每个文件都做这两步）：

A. 在 import 区加一行（紧贴其它 services 的 import 之后）：

```diff
+ import { safeFindEligibleMethods } from "@/services/paypal-sdk-function/safe-find-eligible-methods";
```

B. 把 `findEligibleMethods` 调用 + 紧跟其后加一行早退：

```diff
- const paymentMethods = await sdkInstance.findEligibleMethods({
-     currencyCode: "EUR",
- });
+ const paymentMethods = await safeFindEligibleMethods(sdkInstance, {
+     currencyCode: "EUR",
+ });
+ if (!paymentMethods) return;
```

⚠️ **sepa 的 currencyCode 是 `"PLN"`，不是 EUR**，按文件实际值改。**不要顺便修这个，原样保留**——是另一个潜在 bug，本次不动。

- [ ] **Step 1: sepaPayments.tsx**

  改 `code/app/jsv6-test-cases/APM/sepa/sepaPayments.tsx`：
  - 在 import 区（line 12 之后，line 14 之前那块 import 区）加上述 import。
  - 把 line 127-129 的 `findEligibleMethods` 调用改成 `safeFindEligibleMethods` 形式，并在其后加 `if (!paymentMethods) return;`。

- [ ] **Step 2: IdealPayments.tsx**

  同上模式。当前 `findEligibleMethods` 在 line 111-113。

- [ ] **Step 3: BancontactPayments.tsx**

  同上模式。当前 `findEligibleMethods` 在 line 114-116。

- [ ] **Step 4: blikPayments.tsx**

  打开文件，找到 `findEligibleMethods` 调用，按模式替换。

- [ ] **Step 5: epsPayments.tsx**

  同上。

- [ ] **Step 6: p24Payments.tsx**

  同上。

- [ ] **Step 7: TypeScript 编译检查**

```bash
cd code && pnpm exec tsc --noEmit
```
Expected: 通过。

- [ ] **Step 8: grep 验证**

确认 APM 目录下不再有任何"裸"调用：
```bash
grep -rn "sdkInstance.findEligibleMethods\|sdkInstance\?\.findEligibleMethods" code/app/jsv6-test-cases/APM/
```
Expected: 无输出（全部替换为 `safeFindEligibleMethods`）。

```bash
grep -rn "safeFindEligibleMethods" code/app/jsv6-test-cases/APM/
```
Expected: 6 个文件各至少 2 行（import + 调用）。

- [ ] **Step 9: Commit**

```bash
git add code/app/jsv6-test-cases/APM/
git commit -m "$(cat <<'EOF'
refactor[2026-06-16]: APM 6 个 scenario 接入 safeFindEligibleMethods

## 解决的问题
APM 下 sepa/ideal/bancontact/blik/eps/p24 的 findEligibleMethods 调用失败时
（如凭证没权限的 400），UI 上完全没有提示。

## 主要改动
- code/app/jsv6-test-cases/APM/sepa/sepaPayments.tsx
- code/app/jsv6-test-cases/APM/ideal/IdealPayments.tsx
- code/app/jsv6-test-cases/APM/bancontact/BancontactPayments.tsx
- code/app/jsv6-test-cases/APM/blik/blikPayments.tsx
- code/app/jsv6-test-cases/APM/eps/epsPayments.tsx
- code/app/jsv6-test-cases/APM/p24/p24Payments.tsx
  统一改为 safeFindEligibleMethods(...) 调用，失败时早退 (if (!paymentMethods) return;)。

## 为什么这么改
集中错误处理，让用户在出错时能看到 PayPal 返回的完整错误详情，
而不是只在 console 看到一行 error log。
EOF
)"
```

---

## Task 6: 替换 buttons 目录 8 个 scenario

**Files:**
- Modify: `code/app/jsv6-test-cases/buttons/buttons-basic/ButtonBasic.tsx`
- Modify: `code/app/jsv6-test-cases/buttons/bcdc/BCDC.tsx`
- Modify: `code/app/jsv6-test-cases/buttons/bcdc-inline/BCDCInline.tsx`
- Modify: `code/app/jsv6-test-cases/buttons/bcdc-inline-autostart/BCDCInlineAutoStart.tsx`
- Modify: `code/app/jsv6-test-cases/buttons/bcdc-inline-with-email/BCDCInlineEmail.tsx`
- Modify: `code/app/jsv6-test-cases/buttons/venmo/Venmo.tsx`
- Modify: `code/app/jsv6-test-cases/buttons/subscriptions/ButtonSubscription.tsx`
- Modify: `code/app/jsv6-test-cases/buttons/custom-button/CustomButton.tsx`

**改动模式**：同 Task 5 的 A/B 两步。

⚠️ **ButtonBasic.tsx 特殊点**：它的 `findEligibleMethods` 调用在 `if (!true) { ... }` 死代码块里（line 73-89）。**仍然按统一模式替换**——以后死代码块被改回 `if (true)` 时立刻可用，且对当前运行行为零影响（死码永不执行）。

⚠️ **早退 `return` 在死代码块里也照样加**，保持模式一致。

- [ ] **Step 1: ButtonBasic.tsx**

  - 在 import 区加 `import { safeFindEligibleMethods } from "@/services/paypal-sdk-function/safe-find-eligible-methods";`。
  - line 77-80 的 `findEligibleMethods({ currencyCode: "USD" })` 替换为 `safeFindEligibleMethods(sdkInstance, { currencyCode: "USD" })`，紧跟一行 `if (!paymentMethods) return;`。

- [ ] **Step 2-8: 其余 7 个文件**

  对 `BCDC.tsx` / `BCDCInline.tsx` / `BCDCInlineAutoStart.tsx` / `BCDCInlineEmail.tsx` / `Venmo.tsx` / `ButtonSubscription.tsx` / `CustomButton.tsx` 各做一遍：
  - Read 文件，定位 `findEligibleMethods` 调用。
  - 在 import 区加 `import { safeFindEligibleMethods } from "@/services/paypal-sdk-function/safe-find-eligible-methods";`（注意：如果该 import 已存在则跳过）。
  - 把 `sdkInstance.findEligibleMethods(<params>)` 替换为 `safeFindEligibleMethods(sdkInstance, <params>)`，并在其后加 `if (!paymentMethods) return;`。
  - 如果调用是无参的（`findEligibleMethods()`），写成 `safeFindEligibleMethods(sdkInstance)`。

- [ ] **Step 9: TypeScript 编译检查**

```bash
cd code && pnpm exec tsc --noEmit
```
Expected: 通过。

- [ ] **Step 10: grep 验证**

```bash
grep -rn "sdkInstance.findEligibleMethods\|sdkInstance\?\.findEligibleMethods" code/app/jsv6-test-cases/buttons/
```
Expected: 无输出。

```bash
grep -rln "safeFindEligibleMethods" code/app/jsv6-test-cases/buttons/
```
Expected: 8 个文件。

- [ ] **Step 11: Commit**

```bash
git add code/app/jsv6-test-cases/buttons/
git commit -m "$(cat <<'EOF'
refactor[2026-06-16]: buttons 8 个 scenario 接入 safeFindEligibleMethods

## 主要改动
- code/app/jsv6-test-cases/buttons/buttons-basic/ButtonBasic.tsx
- code/app/jsv6-test-cases/buttons/bcdc/BCDC.tsx
- code/app/jsv6-test-cases/buttons/bcdc-inline/BCDCInline.tsx
- code/app/jsv6-test-cases/buttons/bcdc-inline-autostart/BCDCInlineAutoStart.tsx
- code/app/jsv6-test-cases/buttons/bcdc-inline-with-email/BCDCInlineEmail.tsx
- code/app/jsv6-test-cases/buttons/venmo/Venmo.tsx
- code/app/jsv6-test-cases/buttons/subscriptions/ButtonSubscription.tsx
- code/app/jsv6-test-cases/buttons/custom-button/CustomButton.tsx
  统一改为 safeFindEligibleMethods(...) 调用 + if (!paymentMethods) return; 早退。

## 为什么这么改
和 APM 6 个 scenario 同口径接入全局错误对话框。
ButtonBasic 的调用本身在 if(!true) 死码块里，仍按模式替换保持一致——
等用户切换死码开关后立即生效，且当前运行零影响。
EOF
)"
```

---

## Task 7: 替换 PLM 目录 3 个 scenario

**Files:**
- Modify: `code/app/jsv6-test-cases/PLM/pay-later/PayLaterWOEligibleChek.tsx`
- Modify: `code/app/jsv6-test-cases/PLM/pay-later-witheligiblecheck/PayLaterEligibleCheck.tsx`
- Modify: `code/app/jsv6-test-cases/PLM/pay-later-witheligiblecheck-backend/PayLaterEligibleCheckBackend.tsx`

**改动模式**：同 Task 5 的 A/B 两步。

⚠️ **`PayLaterEligibleCheck.tsx` 特殊点**：在 `findEligibleMethods` 调用前后**额外**做了 `setIsInitializing(true/false)`（line 88, 92），且 `finally` 块里也有 `setIsInitializing(false)`。早退 `return` 会跳过 line 92 的 `setIsInitializing(false)`，但 `finally` 块的 `setIsInitializing(false)` 仍会执行——overlay 会正常关闭，**不需要额外处理**。

- [ ] **Step 1: PayLaterWOEligibleChek.tsx**

  按模式替换。

- [ ] **Step 2: PayLaterEligibleCheck.tsx**

  按模式替换。**保留** line 88 的 `setIsInitializing(true)` 和 line 92 的 `setIsInitializing(false)`——不要删（虽然 finally 也做这件事，但保留减小本次 diff）。

- [ ] **Step 3: PayLaterEligibleCheckBackend.tsx**

  按模式替换。

- [ ] **Step 4: TypeScript 编译检查**

```bash
cd code && pnpm exec tsc --noEmit
```
Expected: 通过。

- [ ] **Step 5: grep 验证**

```bash
grep -rn "sdkInstance.findEligibleMethods\|sdkInstance\?\.findEligibleMethods" code/app/jsv6-test-cases/PLM/
```
Expected: 无输出。

```bash
grep -rln "safeFindEligibleMethods" code/app/jsv6-test-cases/PLM/
```
Expected: 3 个文件。

- [ ] **Step 6: Commit**

```bash
git add code/app/jsv6-test-cases/PLM/
git commit -m "$(cat <<'EOF'
refactor[2026-06-16]: PLM 3 个 scenario 接入 safeFindEligibleMethods

## 主要改动
- code/app/jsv6-test-cases/PLM/pay-later/PayLaterWOEligibleChek.tsx
- code/app/jsv6-test-cases/PLM/pay-later-witheligiblecheck/PayLaterEligibleCheck.tsx
- code/app/jsv6-test-cases/PLM/pay-later-witheligiblecheck-backend/PayLaterEligibleCheckBackend.tsx
  统一改为 safeFindEligibleMethods(...) 调用 + if (!paymentMethods) return; 早退。

## 为什么这么改
和其它 scenario 同口径接入全局错误对话框。PayLaterEligibleCheck 自带
setIsInitializing(true/false) 守护，早退后由 finally 兜底解除 overlay。
EOF
)"
```

---

## Task 8: 替换 advanced 目录 4 个 scenario

**Files:**
- Modify: `code/app/jsv6-test-cases/advanced/ACDC/CardFields.tsx`
- Modify: `code/app/jsv6-test-cases/advanced/vault-save-payment/ButtonSavePaymentMethod.tsx`
- Modify: `code/app/jsv6-test-cases/advanced/vault-recurring/ButtonVaultRecurring.tsx`
- Modify: `code/app/jsv6-test-cases/advanced/vault-save-with-purchase/ButtonSaveWPurchase.tsx`

**改动模式**：同 Task 5 的 A/B 两步。

⚠️ **CardFields.tsx 特殊点**：和 ButtonBasic 一样，`findEligibleMethods` 调用在 `if (!true) { ... }` 死代码块里（line 203-218）。仍按统一模式替换。

- [ ] **Step 1: CardFields.tsx**

  - 在 import 区加上 `import { safeFindEligibleMethods } from "@/services/paypal-sdk-function/safe-find-eligible-methods";`。
  - line 207-209 的 `findEligibleMethods()`（无参）替换为 `safeFindEligibleMethods(sdkInstance)`，紧跟 `if (!paymentMethods) return;`。

- [ ] **Step 2-4: vault-save-payment / vault-recurring / vault-save-with-purchase**

  对各文件：
  - Read 定位 `findEligibleMethods` 调用。
  - 加 import + 替换调用 + 加早退。

- [ ] **Step 5: TypeScript 编译检查**

```bash
cd code && pnpm exec tsc --noEmit
```
Expected: 通过。

- [ ] **Step 6: grep 验证**

```bash
grep -rn "sdkInstance.findEligibleMethods\|sdkInstance\?\.findEligibleMethods" code/app/jsv6-test-cases/advanced/
```
Expected: 无输出。

```bash
grep -rln "safeFindEligibleMethods" code/app/jsv6-test-cases/advanced/
```
Expected: 4 个文件。

- [ ] **Step 7: Commit**

```bash
git add code/app/jsv6-test-cases/advanced/
git commit -m "$(cat <<'EOF'
refactor[2026-06-16]: advanced 4 个 scenario 接入 safeFindEligibleMethods

## 主要改动
- code/app/jsv6-test-cases/advanced/ACDC/CardFields.tsx
- code/app/jsv6-test-cases/advanced/vault-save-payment/ButtonSavePaymentMethod.tsx
- code/app/jsv6-test-cases/advanced/vault-recurring/ButtonVaultRecurring.tsx
- code/app/jsv6-test-cases/advanced/vault-save-with-purchase/ButtonSaveWPurchase.tsx
  统一改为 safeFindEligibleMethods(...) 调用 + if (!paymentMethods) return; 早退。

## 为什么这么改
和 APM/buttons/PLM 同口径。CardFields 调用同样在 if(!true) 死码块里，
仍按模式替换保持一致。
EOF
)"
```

---

## Task 9: 替换 browser-display 目录 1 个 scenario

**Files:**
- Modify: `code/app/jsv6-test-cases/browser-display/merchantAsyncValidation/MerchantAsyncValidationPattern.tsx`

- [ ] **Step 1: 替换**

按 Task 5 的 A/B 两步改 `MerchantAsyncValidationPattern.tsx`。

- [ ] **Step 2: TypeScript 编译检查**

```bash
cd code && pnpm exec tsc --noEmit
```
Expected: 通过。

- [ ] **Step 3: 全局 grep 最终验证**

最终确认整个项目（除工具函数自身外）不再有"裸"调用：
```bash
grep -rn "sdkInstance.findEligibleMethods\|sdkInstance\?\.findEligibleMethods" code/app/
```
Expected: 无输出。

```bash
grep -rln "safeFindEligibleMethods" code/app/jsv6-test-cases/
```
Expected: 22 个文件。

- [ ] **Step 4: Commit**

```bash
git add code/app/jsv6-test-cases/browser-display/
git commit -m "$(cat <<'EOF'
refactor[2026-06-16]: browser-display MerchantAsyncValidationPattern 接入 safeFindEligibleMethods

## 主要改动
- code/app/jsv6-test-cases/browser-display/merchantAsyncValidation/MerchantAsyncValidationPattern.tsx:
  改为 safeFindEligibleMethods(...) 调用 + if (!paymentMethods) return;。

## 为什么这么改
最后一个 scenario，至此所有 22 个调用点统一接入全局错误对话框。
EOF
)"
```

---

## Task 10: 端到端手动验证

**目的**：在真实浏览器里跑一遍，确认 dialog 在错误时弹、正常时不弹、能复制 details。

- [ ] **Step 1: 启动 dev server**

```bash
cd code && pnpm dev
```

打开 http://localhost:3000。

- [ ] **Step 2: 复现 400 错误**

  1. 打开右上角的 Environment Configuration 面板，把 Client ID + Secret 切到默认的 **"US Acct"** 预设（理论上没 SEPA 权限的那一组）。点 Save Configuration。
  2. 导航到 SEPA scenario 页面（`/jsv6-test-cases/APM/sepa` 或类似路径，查 Navbar）。
  3. **期望**：页面加载后弹出 `Find Eligible Methods Failed` 对话框，里面能看到 PayPal 返回的 message + Details 区里的完整 JSON（含 `name` / `debug_id` 等）。
  4. 点 Details 区右上角的 **Copy** 按钮，按钮文字应变成 `Copied`。粘贴到任意地方验证内容是 JSON。
  5. 点 **Close**，对话框关闭。

  如果对话框没弹（比如 US Acct 居然有 SEPA 权限），随便把 Client ID 改成一个明显错误的字符串（比如末尾加几个 X），Save，刷新页面再试。

- [ ] **Step 3: 验证正常路径**

  1. 在 Environment Configuration 把 Client ID + Secret 切到 **"C2 Acct"** 预设（用户反馈这组对 SEPA 是好的）。Save。
  2. 重新进入 SEPA scenario 页面。
  3. **期望**：对话框不弹，SEPA 表单（full name / email）正常渲染，按钮可点。

- [ ] **Step 4: 验证其它一个 scenario 不影响**

  1. 用 C2 Acct，进入 buttons/buttons-basic 页面。
  2. **期望**：PayPal 按钮正常渲染（注意 ButtonBasic 走的是死码块外的路径，本质上没调 findEligibleMethods，但页面不应该崩）。

- [ ] **Step 5: 验证完成，无需 commit**

手动验证不产生代码改动。如果发现 bug 回到对应 Task 修复。

---

## Self-Review 已做（plan 作者侧）

- **Spec coverage**：spec 的 3 个新文件 / 1 个 layout 修改 / 22 个 scenario 改动 / Details 默认展开 / Copy 按钮 —— 每条都对应到 Task 1-10。
- **No placeholders**：所有代码块均为完整可粘贴内容。
- **Type consistency**：`useErrorDialogStore` 的 `show({title, message, details})` 形状 = `GlobalErrorDialog` 订阅的字段 = `safeFindEligibleMethods` 调用的形状。函数名 `safeFindEligibleMethods` 全文一致。
- **死码块**：ButtonBasic / CardFields 的 `if (!true)` 已显式标注，统一模式处理。
- **PayLaterEligibleCheck** 的 `setIsInitializing` 在调用前后多出的两行已显式说明保留。
- **sepa 的 currencyCode "PLN"**：显式提醒不要顺手修。
