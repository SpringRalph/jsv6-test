# SDK 配置面板合并 & token 缓存一改即刷新

日期：2026-06-16

## 解决的问题

1. 主页有两个相邻的配置卡片 `EnvPanel`（环境 + 凭据）和 `AuthModePanel`（SDK init mode），逻辑同属"SDK 初始化所需的配置"，分两块割裂、视觉上也是两套颜色基调。
2. 后端 `/api/paypal/client-token` 用 `Map<"${clientId}::${env}", entry>` 缓存 PayPal OAuth access_token（响应给前端时叫 `clientToken`），TTL 10 分钟，没有任何显式失效机制：
   - cache key 不含 secret——用户修改了 secret 但 clientId 不变时，10 分钟内仍返回老 token。
   - 用户在 PayPal 后台旋转密钥后，缓存里的 token 已经被 PayPal invalidate，但本地还会继续返回直到过期。
   - 用户在调试中频繁切 env/clientId/secret，难以确定"当前用的 token 是不是新的"。
3. 当前 `EnvPanel`/`AuthModePanel` 在 5 个地方各自散落调用 `bumpSdkReloadToken()` + `unloadPayPalWebSdk()`，逻辑重复、容易漏。

## 设计目标

- UI：把 `EnvPanel` + `AuthModePanel` 合并成一个 `SdkConfigPanel`，单 Card、分组小节、颜色统一。
- 行为：任何"会影响 SDK 初始化输入"的设置变化（env / clientId / secret / authMode）发生后，前后端的 token 缓存都必须刷新，调用方写一行 helper 即可，不要再到处拷贝逻辑。

## 架构

### 1. UI 合并：新建 `SdkConfigPanel`

**位置：** `components/panels/SdkConfigPanel.tsx`（新增）

**结构：** 单个 `Card`，内部按小节标题划分：

```
┌─ SDK Configuration ───────────────────────────┐
│                                                │
│  Environment                                   │
│  ┌──────────┬──────────┐                       │
│  │ Sandbox  │   Live   │                       │
│  └──────────┴──────────┘                       │
│                                                │
│  Credentials                                   │
│  Client ID  [CredentialCombobox ▾]             │
│  Secret     [CredentialCombobox ▾]             │
│  [Save Configuration]  [Reset]  [Vault Mgr]    │
│                                                │
│  SDK Init Mode                                 │
│  ( ) clientToken — 后端 OAuth → access token   │
│  (•) clientId    — 直接传 clientId             │
│                                                │
└────────────────────────────────────────────────┘
```

**视觉：** 统一蓝色基调（沿用 `EnvPanel` 现有的 `border-blue-200` / `bg gradient from blue-50`），删除 `AuthModePanel` 的紫色。小节之间用 `space-y-6` 拉开间距，每个小节标题用 `text-sm font-semibold text-muted-foreground uppercase tracking-wide`。

**Live 确认弹窗：** 保留现有逻辑（`EnvPanel.tsx:293-336`），切到 Live 时弹确认。

**page.tsx 改动：** `app/page.tsx:135-136` 的 `<EnvPanel /> <AuthModePanel />` 替换为单个 `<SdkConfigPanel />`。

**删除：** `components/panels/EnvPanel.tsx`、`components/panels/AuthModePanel.tsx`。

### 2. 后端：增加 DELETE handler

**位置：** `app/api/paypal/client-token/route.ts`（编辑）

新增：

```ts
export async function DELETE() {
  const size = tokenCache.size;
  tokenCache.clear();
  consola.info(`[/api/paypal/client-token] cache cleared (${size} entries)`);
  return new NextResponse(null, { status: 204 });
}
```

清空整个 `Map`，不按 key 精挑。理由：
- 这是开发/测试工具，不是生产多租户服务，没有"误伤别人"的风险。
- 用户对"换回原设置时仍然拿旧 token"也是不想要的（备选方案 C 的痛点）。
- 实现最简，最难出错。

GET handler 不动。`fetchClientTokenFromPayPal` 不动。

### 3. 前端：集中式 `applySettingsChange()` helper

**位置：** `hooks/useSettingsChange.ts`（新增）

```ts
export function useSettingsChange() {
  const bumpSdkReloadToken = useEnvStore((s) => s.bumpSdkReloadToken);
  return async function applySettingsChange() {
    try {
      await fetch("/api/paypal/client-token", { method: "DELETE" });
    } catch (e) {
      consola.warn("[applySettingsChange] DELETE cache failed", e);
      // 后端清不到不阻塞前端刷新；TTL 兜底
    }
    unloadPayPalWebSdk();
    bumpSdkReloadToken();
  };
}
```

**调用方：** `SdkConfigPanel` 内部的所有 setter 入口（env 切换、Credentials 保存、Reset、authMode 切换）都改成 `await applySettingsChange()` 替代当前散落的两步调用。

**顺序：** 先 DELETE（清后端） → 再 unloadScript（清 window.paypal） → 最后 bumpSdkReloadToken（触发 usePayPalWebSdk 重载、ready→false→true、所有场景组件 [ready] 依赖触发 re-init → 重新请求 client-token → 后端 cache miss → 拿到新 token）。这个顺序保证场景组件 re-init 时后端一定 fetch 新的 token。

### 4. 场景组件：不动

已经验证 `usePayPalWebSdk.ts:20` 在 `sdkReloadToken` 变化时把 `ready` 拉回 false，所以场景组件用 `[ready]` 作 useEffect 依赖（如 `ButtonBasic.tsx:109`）能自动 re-init。不需要批量修改各个 scenario。

## 数据流

```
[用户在 SdkConfigPanel 里改任意一项]
        ↓
[setter 写入 useEnvStore (env/clientId/secret/authMode)]
        ↓
[await applySettingsChange()]
        ├─→ DELETE /api/paypal/client-token  (清空后端 Map)
        ├─→ unloadPayPalWebSdk()             (清 window.paypal)
        └─→ bumpSdkReloadToken()             (sdkReloadToken++)
                ↓
[usePayPalWebSdk useEffect 重新跑]
        ├─→ setReady(false)
        ├─→ loadPayPalWebSdk(...)             (重新加载 SDK script)
        └─→ setReady(true)
                ↓
[所有场景组件 [ready] 依赖触发 re-init]
        ↓
[getInitOptions()]
   ├─ authMode === "clientId":   返回 {clientId}，无网络
   └─ authMode === "clientToken": fetch GET /api/paypal/client-token
                                  → 后端 cache miss → OAuth → 缓存新 token → 返回
        ↓
[paypal.createInstance(initOptions) → 新 button 挂载]
```

## 错误处理

- DELETE 网络失败：不阻塞前端刷新，仅 `consola.warn`。前端 SDK 仍然 reload，下次 GET 命中老 cache 也最多再用 10 分钟 TTL；TTL 是兜底安全网。
- GET 拉新 token 失败：现有逻辑保留（500 错误响应，`fetchClientTokenFromPayPal` catch 里 `tokenCache.delete(cacheKey)`）。

## 测试

- 切 env (sandbox ↔ live)：用 devtools Network 面板确认每次切换看到 DELETE→GET 两条请求，GET 响应里的 clientToken 和切换前不一样。
- 改 clientId：同上。
- 改 secret（同一 clientId）：以前会复用老 token，现在必须看到新 token。这是本次修复的核心 case。
- 切 authMode：clientToken→clientId 时不需要 fetch（直接用 clientId），但仍应 DELETE + reload script；clientId→clientToken 时应看到 GET 新 token。
- 切回原 env+clientId 组合：必须看到 GET 拿新 token，不能复用之前的 cache 条目。

## 不做的事

- 不改场景组件（`app/jsv6-test-cases/**` 下的所有 scenario），原因见 §4。
- 不动 `useEnvStore` 的 schema（env/authMode/clientId/secret 字段都保留）。`bumpSdkReloadToken` 仍是 store 方法，只是不再被组件直接调，由 `applySettingsChange` 间接调。
- 不动 `usePayPalWebSdk`、`useSdkInitOptions`、`getPayPalHeaders`、`getBrowserSafeClientToken` 这些已经正确的链路。
- 不引入持久化、不引入新依赖、不动 cache key 格式（key 还是 `clientId::env`，但 DELETE 直接全清，所以 key 含不含 secret 已经不再是 bug 来源）。

## 文件清单

新增：
- `components/panels/SdkConfigPanel.tsx`
- `hooks/useSettingsChange.ts`

编辑：
- `app/api/paypal/client-token/route.ts`（加 DELETE handler）
- `app/page.tsx`（换面板引用）

删除：
- `components/panels/EnvPanel.tsx`
- `components/panels/AuthModePanel.tsx`
