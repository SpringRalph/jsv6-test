# Unsaved Credentials Indicator — Design

## 解决的问题

`SdkConfigPanel` 的 Credentials 区块（一方 Client ID/Secret，或三方 Partner Client ID/Secret/授权 Merchant ID）改完之后必须手动点「Save Configuration」才会真正写入 store 并触发 SDK 重新加载。目前改完字段后没有任何视觉提示，用户容易忘记点 Save，误以为改动已生效。

## 主要改动

### 1. 每个字段单独算 dirty 状态

`components/panels/SdkConfigPanel.tsx` 里已有的 `handleSave` 内部本来就会算一次"是否改动"（`changed` 变量），本次改动把这个比较逻辑拆成每个字段独立的、在每次渲染都计算的布尔值，而不是只在点击 Save 时算一次：

一方模式（`isPartnerMode === false`）：
- `clientIdDirty = activeLocalClientId !== (isSandbox ? clientId : liveClientId)`
- `secretDirty = activeLocalSecret !== (isSandbox ? secret : liveSecret)`

三方模式（`isPartnerMode === true`）：
- `partnerClientIdDirty = activeLocalPartnerClientId !== (isSandbox ? partnerClientId : livePartnerClientId)`
- `partnerSecretDirty = activeLocalPartnerSecret !== (isSandbox ? partnerSecret : livePartnerSecret)`
- `merchantIdDirty = activeLocalAuthAssertionMerchantId !== (isSandbox ? authAssertionMerchantId : liveAuthAssertionMerchantId)`

`isDirty`（当前可见分支里，任意字段有改动）= 对应分支里几个 dirty 值 `||` 起来。

### 2. 视觉呈现

- **改动过的输入框**：条件性地在对应的 `Input` / `CredentialCombobox` 上追加 `className`，把边框颜色换成 `border-amber-400 dark:border-amber-500`（复用现有 Live 环境警告已经在用的琥珀色调，保持"需要注意"语义一致）。这两个组件的 `className` 都经过 `cn()`（`clsx` + `tailwind-merge`）合并，后传入的 `border-*` 会正确覆盖默认的 `border-input`，不需要改这两个基础组件。
- **Save Configuration 按钮**：`isDirty` 为真时追加 `ring-2 ring-amber-400 ring-offset-2 animate-pulse`（Tailwind 内置的透明度脉冲动画，不需要新写 keyframes）。保存成功后，本地状态被写入 store，所有 dirty 值立刻变回 `false`，按钮自动恢复成不带 ring/动画的普通蓝色按钮。
- Reset 按钮、Environment、集成模式、SDK Init Mode 这些切换后立即生效（点击就调用 `applySettingsChange()`），本来就没有"未保存"状态，不需要任何改动。

### 3. 不做的事

- 不加表单必填校验（用户已确认：测试工具，空值可能是故意测试用的，強制校验反而碍事）。
- 不加离开页面/切换 tab 前的确认弹窗，只做视觉提示。
- 不改 `handleSave`/`handleReset` 的实际保存逻辑，只是把已有的比较逻辑提前暴露成 render 阶段可读的状态。

## 为什么这么改

- 复用现有的琥珀色"需要注意"语义（Live 环境警告已经用了 `amber-*`），视觉上一致，不用发明新的颜色系统。
- 用 Tailwind 内置 `animate-pulse` 而不是自定义动画，减少新增 CSS。
- 字段级别 + 按钮级别双重提示，字段级别精确指出"哪个字段没保存"，按钮级别提示"该点这个按钮了"，两者互补。
- 保持范围小：只影响 Credentials 区块的展示逻辑，不触碰 store、不触碰保存/重置的实际行为、不引入校验或阻断式交互。
