# SDK 配置面板合并 & token 缓存一改即刷新 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `EnvPanel` 与 `AuthModePanel` 合并成单个 `SdkConfigPanel`，并保证任何 env/clientId/secret/authMode 变更都立刻清掉前后端的 PayPal token 缓存。

**Architecture:** 后端 `/api/paypal/client-token` 增加 DELETE handler 直接 `tokenCache.clear()`；新建 `useSettingsChange` hook 把 "DELETE 后端 → unload SDK script → bump reload token" 三步集中化；新建 `SdkConfigPanel` 调用此 hook 替代原本两个面板里的 5 处散落调用。场景组件不动（`usePayPalWebSdk.ts:20` 已经在 `sdkReloadToken` 变化时把 `ready` 拉回 false 再回 true，所以场景组件 `[ready]` 依赖已经能正确 re-init）。

**Tech Stack:** Next.js (App Router) + Edge runtime API route + Zustand store + Radix AlertDialog + Tailwind。无单元测试框架，验证靠跑 `pnpm dev` + 浏览器 Network 面板。

**Spec:** [docs/superpowers/specs/2026-06-16-sdk-config-and-token-cache-refresh-design.md](../specs/2026-06-16-sdk-config-and-token-cache-refresh-design.md)

---

## File Structure

新增：
- `code/hooks/useSettingsChange.ts` — 集中"设置已变更"副作用
- `code/components/panels/SdkConfigPanel.tsx` — 合并后的统一配置面板

编辑：
- `code/app/api/paypal/client-token/route.ts` — 加 DELETE handler
- `code/app/page.tsx` — 替换面板引用

删除：
- `code/components/panels/EnvPanel.tsx`
- `code/components/panels/AuthModePanel.tsx`

---

## Task 1: 后端 DELETE handler

把缓存失效做成原子 API 端点。最小改动、可单独验证。

**Files:**
- Modify: `code/app/api/paypal/client-token/route.ts`（在 GET handler 之后追加）

- [ ] **Step 1: 在 route.ts 末尾追加 DELETE handler**

打开 `code/app/api/paypal/client-token/route.ts`，文件目前最后一行是 `}`（GET handler 的闭合括号，在 line 139）。在它后面追加：

```ts

export async function DELETE() {
  const size = tokenCache.size;
  tokenCache.clear();
  consola.info(`[/api/paypal/client-token] cache cleared (${size} entries)`);
  return new NextResponse(null, { status: 204 });
}
```

注意：
- 不需要新 import，`NextResponse` 和 `consola` 已经在文件顶部 import 过了。
- 不接受任何参数，请求体也不读——一刀全清是有意的设计选择。
- 不动 GET handler、不动 `fetchClientTokenFromPayPal`、不动 `tokenCache` 声明、不动 `CACHE_TTL`。

- [ ] **Step 2: 跑起 dev server**

打开一个新终端：

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test/code
pnpm dev
```

等到看到 `Ready in Xs` 之类的输出。如果端口冲突，按照 Next.js 的提示用替代端口。下面假设是默认的 3000。

- [ ] **Step 3: 用 curl 验证 DELETE 端点**

另开终端：

```bash
# 先 GET 让 cache 长出来一条
curl -i 'http://localhost:3000/api/paypal/client-token' \
  -H 'x-paypal-client-id: dummy-test' \
  -H 'x-paypal-secret: dummy-test' \
  -H 'x-paypal-env: sandbox'

# 然后 DELETE
curl -i -X DELETE 'http://localhost:3000/api/paypal/client-token'
```

Expected：
- 第一条 GET：可能返回 500（dummy 凭据 OAuth 不会过），但 dev server 控制台应该打印 `[/api/paypal/client-token]: HTTP REQUEST received`，说明 handler 走到了。如果是 200 且 dummy 凭据真能拿到 token，那更说明流程正常。
- 第二条 DELETE：HTTP 204，response body 为空。dev server 控制台应该打印 `[/api/paypal/client-token] cache cleared (N entries)`，N 是清掉的条数。
- 第二次 DELETE：同样 204，但日志里 N=0。

如果 DELETE 报 404，说明 handler 没被识别——检查 export 是否拼成了 `DELETE`（全大写）。

- [ ] **Step 4: Commit**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test
git add code/app/api/paypal/client-token/route.ts
git commit -m "$(cat <<'EOF'
feat[2026-06-17]: /api/paypal/client-token 增加 DELETE handler

## 解决的问题
后端 token cache (Map<clientId::env, entry>) 缺乏显式失效机制，导致用户改 secret、旋转密钥等场景下 10 分钟内继续返回旧 token。

## 主要改动
- code/app/api/paypal/client-token/route.ts: 追加 DELETE handler，一次性 tokenCache.clear() 并返回 204

## 为什么这么改
这是开发/测试工具，没有"误清别人 cache"的多租户风险，全清最简单也最不容易漏。后续前端会在用户改任意设置时调用此端点。
EOF
)"
```

---

## Task 2: `useSettingsChange` hook

把"设置已变更"的三步副作用打包成一个 hook，供新面板调用。

**Files:**
- Create: `code/hooks/useSettingsChange.ts`

- [ ] **Step 1: 创建 hook 文件**

新建 `code/hooks/useSettingsChange.ts`，写入：

```ts
"use client";

import { useEnvStore } from "@/store/useEnvStore";
import { unloadPayPalWebSdk } from "@/lib/paypalScript";
import consola from "consola";

/**
 * 任何会影响 SDK 初始化输入的设置变更（env / clientId / secret / authMode）
 * 都应该调用本 hook 返回的 applySettingsChange()。
 *
 * 三步：
 *   1. DELETE /api/paypal/client-token — 清后端 OAuth token cache
 *   2. unloadPayPalWebSdk()            — 清 window.paypal & <script>
 *   3. bumpSdkReloadToken()            — 触发 usePayPalWebSdk 重载，
 *                                        进而让所有场景组件 [ready] 依赖重跑 createInstance
 */
export function useSettingsChange() {
  const bumpSdkReloadToken = useEnvStore((s) => s.bumpSdkReloadToken);

  return async function applySettingsChange() {
    try {
      const res = await fetch("/api/paypal/client-token", { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        consola.warn(
          `[applySettingsChange] DELETE returned ${res.status}; client cache 仍会刷新`,
        );
      }
    } catch (e) {
      consola.warn("[applySettingsChange] DELETE 网络失败，client cache 仍会刷新", e);
      // 后端清不到不阻塞前端：TTL 10min 是兜底
    }
    unloadPayPalWebSdk();
    bumpSdkReloadToken();
  };
}
```

注意：
- DELETE 失败 *不要* throw——前端 unload + bump 必须照常发生，否则 UI 会卡在旧状态。后端那条本来 10 分钟也会过期，是安全的退化。
- hook 名故意叫 `useSettingsChange` 而不是 `useResetSdk`，因为它的语义是"通知系统'设置改了'"，副作用细节是实现内部的事情。

- [ ] **Step 2: TypeScript 编译检查**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test/code
pnpm tsc --noEmit
```

Expected：无报错。如果报 `Cannot find module '@/store/useEnvStore'` 之类，确认是不是在 monorepo 根跑成了——必须在 `code/` 目录里跑。

- [ ] **Step 3: Commit**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test
git add code/hooks/useSettingsChange.ts
git commit -m "$(cat <<'EOF'
feat[2026-06-17]: 新增 useSettingsChange hook 集中设置变更副作用

## 解决的问题
EnvPanel / AuthModePanel 在 5 处分别拷贝了 "unloadPayPalWebSdk() + bumpSdkReloadToken()" 两步副作用，加 DELETE 后端 cache 这一步后会变三步，重复 5 份不可维护。

## 主要改动
- code/hooks/useSettingsChange.ts: 新增 hook，returns 一个 async function：DELETE 后端 token cache → unloadPayPalWebSdk → bumpSdkReloadToken

## 为什么这么改
集中化后未来 SDK 配置项增加（比如再加一个 webhook url），只在 hook 里调一次即可，调用方零成本。DELETE 网络失败时只 warn，不 throw，避免前端被网络抖动卡死。
EOF
)"
```

---

## Task 3: `SdkConfigPanel` — 合并面板

实现合并后的单卡片面板。代码主体来自原 `EnvPanel`，加入原 `AuthModePanel` 的 init mode 切换小节，并把所有 `bumpSdkReloadToken + unloadPayPalWebSdk` 替换为 `applySettingsChange`。

**Files:**
- Create: `code/components/panels/SdkConfigPanel.tsx`

- [ ] **Step 1: 创建 SdkConfigPanel.tsx**

新建 `code/components/panels/SdkConfigPanel.tsx`，写入：

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

const SHOPPAAS_SANDBOX_CLIENT_ID =
    "ATIwW9NdRH9Nqde8MCftI_0QbOL9APdYok0a7ircWl2-3fBHv-CoMYsfIDpcUDisqTHmHT7d0Dz9DV7V";
const SHOPPAAS_SANDBOX_SECRET_KEY =
    "EC-Qcp-6LdYoEw9g02iTkVTRHa49c_HLP19P2hxbSHATN3cov2_G-wmFzp5-Cx2gK3phIzrKhOhbLhPJ";

const SANDBOX_CLIENT_ID_OPTIONS: CredentialOption[] = [
    { label: "US Acct", value: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "" },
    { label: "C2 Acct", value: SANDBOX_CLIENT_ID_C2 },
    { label: "Shoppaas", value: SHOPPAAS_SANDBOX_CLIENT_ID },
];

const SANDBOX_SECRET_OPTIONS: CredentialOption[] = [
    { label: "US Acct", value: process.env.NEXT_PUBLIC_PAYPAL_SECRET ?? "" },
    { label: "C2 Acct", value: SANDBOX_SECRET_ID_C2 },
    { label: "Shoppaas", value: SHOPPAAS_SANDBOX_SECRET_KEY },
];

const SANDBOX_CREDENTIAL_PAIRS: Record<string, string> = {
    [process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ""]:
        process.env.NEXT_PUBLIC_PAYPAL_SECRET ?? "",
    [SANDBOX_CLIENT_ID_C2]: SANDBOX_SECRET_ID_C2,
    [SHOPPAAS_SANDBOX_CLIENT_ID]: SHOPPAAS_SANDBOX_SECRET_KEY,
};

const LIVE_CREDENTIAL_PAIRS: Record<string, string> = {
    [LIVE_CLIENT_ID_C2]: LIVE_SECRET_C2,
};

const LIVE_CLIENT_ID_OPTIONS: CredentialOption[] = [
    { label: "Live Test Account", value: LIVE_CLIENT_ID_C2 },
];

const LIVE_SECRET_OPTIONS: CredentialOption[] = [
    { label: "Live Test Account", value: LIVE_SECRET_C2 },
];

const SECTION_TITLE_CLS =
    "text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2";

export function SdkConfigPanel() {
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
    const applySettingsChange = useSettingsChange();

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

    const handleClientIdChange = (newClientId: string) => {
        setActiveLocalClientId(newClientId);
        const pairs = isSandbox
            ? SANDBOX_CREDENTIAL_PAIRS
            : LIVE_CREDENTIAL_PAIRS;
        const pairedSecret = pairs[newClientId];
        if (pairedSecret !== undefined) {
            setActiveLocalSecret(pairedSecret);
        }
    };

    const handleEnvToggle = async (newEnv: PayPalEnv) => {
        if (newEnv === env) return;
        if (newEnv === "live") {
            setShowLiveConfirm(true);
            return;
        }
        setEnv(newEnv);
        await applySettingsChange();
    };

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

    const handleReset = async () => {
        reset();
        setLocalClientId(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "");
        setLocalSecret(process.env.NEXT_PUBLIC_PAYPAL_SECRET ?? "");
        setLocalLiveClientId(LIVE_CLIENT_ID_C2);
        setLocalLiveSecret(LIVE_SECRET_C2);
        await applySettingsChange();
    };

    const handleAuthModeToggle = async (mode: AuthMode) => {
        if (mode === authMode) return;
        setAuthMode(mode);
        await applySettingsChange();
    };

    const clientIdOptions = isSandbox
        ? SANDBOX_CLIENT_ID_OPTIONS
        : LIVE_CLIENT_ID_OPTIONS;
    const secretOptions = isSandbox
        ? SANDBOX_SECRET_OPTIONS
        : LIVE_SECRET_OPTIONS;

    return (
        <>
            <Card className="p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl -z-10" />

                <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    SDK Configuration
                </h2>

                <div className="space-y-6">
                    {/* ────── Environment ────── */}
                    <section>
                        <p className={SECTION_TITLE_CLS}>Environment</p>
                        <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm">
                            <button
                                type="button"
                                onClick={() => handleEnvToggle("sandbox")}
                                className={`px-4 py-1.5 transition-colors ${
                                    isSandbox
                                        ? "bg-blue-600 text-white font-semibold"
                                        : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                Sandbox
                            </button>
                            <button
                                type="button"
                                onClick={() => handleEnvToggle("live")}
                                className={`px-4 py-1.5 transition-colors ${
                                    !isSandbox
                                        ? "bg-green-600 text-white font-semibold"
                                        : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                Live
                            </button>
                        </div>
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

                    {/* ────── SDK Init Mode ────── */}
                    <section>
                        <p className={SECTION_TITLE_CLS}>SDK Init Mode</p>
                        <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm">
                            <button
                                type="button"
                                onClick={() =>
                                    handleAuthModeToggle("clientToken")
                                }
                                className={`flex items-center gap-2 px-4 py-1.5 transition-colors ${
                                    authMode === "clientToken"
                                        ? "bg-blue-600 text-white font-semibold"
                                        : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                <Coins className="w-4 h-4" />
                                clientToken
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    handleAuthModeToggle("clientId")
                                }
                                className={`flex items-center gap-2 px-4 py-1.5 transition-colors ${
                                    authMode === "clientId"
                                        ? "bg-blue-600 text-white font-semibold"
                                        : "bg-background text-muted-foreground hover:bg-muted"
                                }`}
                            >
                                <KeyRound className="w-4 h-4" />
                                clientId
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            {authMode === "clientToken"
                                ? "clientToken 模式：后端通过 OAuth 换取 access token，传给 createInstance()"
                                : "clientId 模式：直接将 clientId 传给 createInstance()，无需后端 token 接口"}
                        </p>
                    </section>
                </div>
            </Card>

            {/* Live environment confirmation dialog */}
            <AlertDialog.Root
                open={showLiveConfirm}
                onOpenChange={setShowLiveConfirm}
            >
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-amber-200 bg-white p-6 shadow-2xl dark:border-amber-800 dark:bg-zinc-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                        <div className="mb-4 flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                                <AlertTriangle
                                    className="h-5 w-5 text-amber-600 dark:text-amber-400"
                                    strokeWidth={2}
                                />
                            </span>
                            <AlertDialog.Title className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                                Switch to Live Environment
                            </AlertDialog.Title>
                        </div>
                        <AlertDialog.Description className="mb-6 text-sm text-muted-foreground leading-relaxed">
                            You are now in{" "}
                            <span className="font-semibold text-amber-700 dark:text-amber-400">
                                Live Environment
                            </span>
                            . Some features behavior would be different because
                            of the scope of your account!
                        </AlertDialog.Description>
                        <div className="flex justify-end gap-3">
                            <AlertDialog.Cancel asChild>
                                <button className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                                    Cancel
                                </button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                                <button
                                    onClick={confirmSwitchToLive}
                                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
                                >
                                    I understand, switch to Live
                                </button>
                            </AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </>
    );
}
```

关键差异（对比原 `EnvPanel`）：
- import：去掉 `unloadPayPalWebSdk`、去掉对 `bumpSdkReloadToken` 的解构；增加 `useSettingsChange`、`AuthMode`、`KeyRound`、`Coins`。
- 解构 store：增加 `authMode`、`setAuthMode`，移除 `bumpSdkReloadToken`。
- 所有 setter handler 改 async，把 `unloadPayPalWebSdk(); setX(); bumpSdkReloadToken();` 三行变成 `setX(); await applySettingsChange();`。注意是**先** setX 再 apply，因为 apply 触发的 reload effect 会读 store——store 必须已经是新值。
- Reset 里硬编码的 live 凭据字符串改用 `LIVE_CLIENT_ID_C2` / `LIVE_SECRET_C2` 常量，避免和 store 默认值漂移。
- 新增 `handleAuthModeToggle` 取代原 `AuthModePanel`。
- 整体卡片标题从"Environment Configuration"改成"SDK Configuration"；视觉用蓝色基调。
- 三个小节用 `<section>` + `SECTION_TITLE_CLS` 区分。

- [ ] **Step 2: TypeScript 编译检查**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test/code
pnpm tsc --noEmit
```

Expected：无报错。

- [ ] **Step 3: Commit**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test
git add code/components/panels/SdkConfigPanel.tsx
git commit -m "$(cat <<'EOF'
feat[2026-06-17]: 新增 SdkConfigPanel 统一 env/credentials/init-mode 配置

## 解决的问题
原本 EnvPanel（蓝色 ⚙️）和 AuthModePanel（紫色 🔌）两个相邻卡片其实都是"初始化 SDK 需要的配置"，分两块割裂、颜色不统一。

## 主要改动
- code/components/panels/SdkConfigPanel.tsx: 新增合并面板，单卡片 + 三个 <section>（Environment / Credentials / SDK Init Mode），颜色统一蓝色基调
- 所有 setter handler 改为先写 store 再 await applySettingsChange()，由 hook 集中负责清前后端 cache + bump SDK reload

## 为什么这么改
单卡片让用户在一个视觉单元里看完所有 SDK 输入。setter 顺序"先写 store 再 apply"是有意的——apply 触发的 useEffect 会读 store 的最新值。
EOF
)"
```

---

## Task 4: 切换 page.tsx 并删除旧面板

把主页改用新组件，并删掉两个老文件。

**Files:**
- Modify: `code/app/page.tsx:3-4, 135-136`
- Delete: `code/components/panels/EnvPanel.tsx`
- Delete: `code/components/panels/AuthModePanel.tsx`

- [ ] **Step 1: 改 page.tsx 的 import**

在 `code/app/page.tsx` 第 3-4 行，把：

```tsx
import { EnvPanel } from "@/components/panels/EnvPanel";
import { AuthModePanel } from "@/components/panels/AuthModePanel";
```

替换成：

```tsx
import { SdkConfigPanel } from "@/components/panels/SdkConfigPanel";
```

- [ ] **Step 2: 改 page.tsx 的 JSX**

在 `code/app/page.tsx` 第 135-136 行，把：

```tsx
                <EnvPanel />
                <AuthModePanel />
```

替换成：

```tsx
                <SdkConfigPanel />
```

- [ ] **Step 3: 删除旧文件**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test
rm code/components/panels/EnvPanel.tsx
rm code/components/panels/AuthModePanel.tsx
```

- [ ] **Step 4: 全仓引用扫描**

确认没有其他文件还在 import 这两个旧组件：

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test
grep -rn "EnvPanel\|AuthModePanel" code/ --include="*.ts" --include="*.tsx"
```

Expected：无输出。如果有输出（除了刚改完的 page.tsx 里不该再有了），照样把那个文件改成 `SdkConfigPanel` 或删除引用。

- [ ] **Step 5: TypeScript 编译检查**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test/code
pnpm tsc --noEmit
```

Expected：无报错。

- [ ] **Step 6: Commit**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test
git add code/app/page.tsx code/components/panels/EnvPanel.tsx code/components/panels/AuthModePanel.tsx
git commit -m "$(cat <<'EOF'
refactor[2026-06-17]: 主页改用 SdkConfigPanel，删除 EnvPanel / AuthModePanel

## 解决的问题
合并面板的最后一步：把主页引用切到新组件，删掉两个不再使用的旧文件。

## 主要改动
- code/app/page.tsx: import 从两个旧面板改为单个 SdkConfigPanel；JSX 同步替换
- code/components/panels/EnvPanel.tsx: 删除
- code/components/panels/AuthModePanel.tsx: 删除

## 为什么这么改
两个旧文件的所有职责已经搬到 SdkConfigPanel；保留只会让后续维护者困惑。
EOF
)"
```

---

## Task 5: 端到端手动验证

跑起 dev server，按 spec 的测试矩阵逐项核对。

**Files:**（无代码改动）

- [ ] **Step 1: 跑 dev server**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test/code
pnpm dev
```

打开 http://localhost:3000（如果端口不同照 Next.js 提示走）。Devtools → Network 面板，打开 "Preserve log"。Application 面板 → Local Storage → `pp-v6-env` 这条可以瞄一眼但别动。

- [ ] **Step 2: 视觉验证合并后的面板**

主页应该看到一个蓝色边框的 "SDK Configuration" 卡片，从上到下三段：
- ENVIRONMENT — Sandbox/Live 切换按钮
- CREDENTIALS — Client ID + Secret combobox + 三个按钮（Save / Reset / Vault Manager）
- SDK INIT MODE — clientToken / clientId 切换按钮

应该看不到任何紫色卡片。"Environment Configuration" 和单独的 "SDK Init Mode" 卡片都不应该再存在。

- [ ] **Step 3: 验证 sandbox ↔ live 切换会清缓存**

当前默认 sandbox + clientToken 模式。打开任意一个 button 类的测试用例（比如 Buttons → buttons-basic），让它先加载一次（看到 Network 里有 `client-token` GET）。然后回到主页，点 Live 按钮，过弹窗确认。

Expected Network 顺序：
1. `DELETE /api/paypal/client-token` → 204
2. 进入测试用例后 → `GET /api/paypal/client-token` → 200，response body `clientToken` 是新的（和 sandbox 那次不一样）

- [ ] **Step 4: 验证 client-id 切换会清缓存**

回到主页，确保还在 sandbox。Client ID combobox 选 "C2 Acct"，点 Save Configuration。

Expected：
1. `DELETE /api/paypal/client-token` → 204
2. 重新打开任意 button 测试 → `GET /api/paypal/client-token` 拿到的 clientToken 和之前 US Acct 的不一样

- [ ] **Step 5: 验证 secret 单独变更会清缓存（核心 bug 修复点）**

回到主页，sandbox + C2 Acct（client-id 不变），把 Secret 那一栏的值手动改一两个字符（再改回去也行——目的是让 secret 局部 state 和 store 里不同），然后点 Save。

Expected：
1. `DELETE /api/paypal/client-token` → 204
2. 重新打开 button 测试 → 后端被迫重新 OAuth（虽然如果 secret 改错了会 500，那也是正确的 — 重点是看到 DELETE 发了）

注：如果 secret 改成了真的错的，OAuth 会失败，前端 button 会报错——这是预期的，重点是 cache 不再让你"以为生效了其实用的还是旧 token"。

- [ ] **Step 6: 验证 SDK init mode 切换会清缓存**

回到主页，从 clientToken 切到 clientId。

Expected：
1. `DELETE /api/paypal/client-token` → 204
2. 重新打开 button 测试 → **没有** `GET /client-token` 请求（因为 clientId 模式不需要 token），但 button 应该照常工作

再从 clientId 切回 clientToken：
1. `DELETE` → 204
2. 重新打开 button → `GET /client-token` 拿到新 token

- [ ] **Step 7: 验证 Reset 按钮会清缓存**

点 Reset。

Expected：
1. Combobox 回到默认值（US Acct sandbox）
2. `DELETE /api/paypal/client-token` → 204
3. 重新打开任意 button 测试 → 新 token

- [ ] **Step 8: 验证 DELETE 失败时前端不卡住**

模拟后端不可用：把 dev server 那个终端 Ctrl-C 掉，但**不要关浏览器**。在浏览器 Devtools Console，点主页的环境切换按钮——会看到 `[applySettingsChange] DELETE 网络失败` 的 warn，且 SDK script 应该还是被重载了（看到 `<script id="paypal-websdk-v6-core">` 在 DOM 里被替换）。

重启 dev server，继续验证下一步。

- [ ] **Step 9: 视觉回归**

主页快速过一眼：测试用例列表的卡片、headline、其他视觉元素和重构前一致；只有 SDK Configuration 这块变了样。如果 Live 模式的橙色警告横幅在切到 live 后还能正常显示，dialog 还能正常弹/关，OK。

- [ ] **Step 10: 没有 git 残留**

```bash
cd /Users/yqiang/Documents/paypal-work/jsv6-test
git status
```

Expected：working tree clean。如果有遗漏的改动，决定是合并到上一个 commit（用 `--amend`，只在还没 push 时安全）还是新开一个 fix commit。

---

## 完成后

- 所有 5 个 task 完成、commit 完毕，无未提交改动。
- 用户验证过端到端流程 OK。
- 不需要 push，按用户的 auto-commit 规范，push 永远要先问。
