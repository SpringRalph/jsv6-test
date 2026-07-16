# Unsaved Credentials Indicator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In `SdkConfigPanel`'s Credentials section, visually flag any input field that differs from its last-saved value, and highlight the "Save Configuration" button so users don't forget to click it.

**Architecture:** Compute per-field "dirty" booleans at render time (comparing each active local input value to its corresponding saved store value — the same comparison `handleSave` already does once on click, just exposed earlier). Feed those booleans into conditional `className` props on the existing `Input`/`CredentialCombobox` components (amber border) and the "Save Configuration" `Button` (pulsing amber ring). No new components, no new store fields, no validation, no blocking dialogs.

**Tech Stack:** React (client component), Tailwind CSS (`cn()` / `tailwind-merge` already used by `Input`/`CredentialCombobox` to merge extra `className`s safely).

---

## Task 1: Add dirty-state tracking and amber visual indicators to `SdkConfigPanel`

**Files:**
- Modify: `components/panels/SdkConfigPanel.tsx`

- [ ] **Step 1: Add per-field dirty booleans and an aggregate `isDirty`**

Insert this block right after the existing `activeLocalAuthAssertionMerchantId`/`setActiveLocalAuthAssertionMerchantId` declarations (i.e., right before `const handleClientIdChange = ...`):

Before:
```tsx
    const activeLocalAuthAssertionMerchantId = isSandbox
        ? localAuthAssertionMerchantId
        : localLiveAuthAssertionMerchantId;
    const setActiveLocalAuthAssertionMerchantId = isSandbox
        ? setLocalAuthAssertionMerchantId
        : setLocalLiveAuthAssertionMerchantId;

    const handleClientIdChange = (newClientId: string) => {
```

After:
```tsx
    const activeLocalAuthAssertionMerchantId = isSandbox
        ? localAuthAssertionMerchantId
        : localLiveAuthAssertionMerchantId;
    const setActiveLocalAuthAssertionMerchantId = isSandbox
        ? setLocalAuthAssertionMerchantId
        : setLocalLiveAuthAssertionMerchantId;

    const clientIdDirty = activeLocalClientId !== (isSandbox ? clientId : liveClientId);
    const secretDirty = activeLocalSecret !== (isSandbox ? secret : liveSecret);
    const partnerClientIdDirty =
        activeLocalPartnerClientId !== (isSandbox ? partnerClientId : livePartnerClientId);
    const partnerSecretDirty =
        activeLocalPartnerSecret !== (isSandbox ? partnerSecret : livePartnerSecret);
    const merchantIdDirty =
        activeLocalAuthAssertionMerchantId !==
        (isSandbox ? authAssertionMerchantId : liveAuthAssertionMerchantId);

    const isDirty = isPartnerMode
        ? partnerClientIdDirty || partnerSecretDirty || merchantIdDirty
        : clientIdDirty || secretDirty;

    const DIRTY_INPUT_CLS = "border-amber-400 dark:border-amber-500";

    const handleClientIdChange = (newClientId: string) => {
```

Note: `DIRTY_INPUT_CLS` is a small local constant (not module-level, since it doesn't need to be) to avoid repeating the same string 5 times below.

- [ ] **Step 2: Apply the amber border to the 3 partner-mode inputs**

Before:
```tsx
                                    <Input
                                        id="partnerClientId"
                                        value={activeLocalPartnerClientId}
                                        onChange={(e) => setActiveLocalPartnerClientId(e.target.value)}
                                        placeholder="test_partner_client_id"
                                    />
```

After:
```tsx
                                    <Input
                                        id="partnerClientId"
                                        className={partnerClientIdDirty ? DIRTY_INPUT_CLS : undefined}
                                        value={activeLocalPartnerClientId}
                                        onChange={(e) => setActiveLocalPartnerClientId(e.target.value)}
                                        placeholder="test_partner_client_id"
                                    />
```

Before:
```tsx
                                    <Input
                                        id="partnerSecret"
                                        type="password"
                                        autoComplete="new-password"
                                        data-lpignore="true"
                                        data-1p-ignore=""
                                        data-bwignore=""
                                        value={activeLocalPartnerSecret}
                                        onChange={(e) => setActiveLocalPartnerSecret(e.target.value)}
                                        placeholder="test_partner_client_secret"
                                    />
```

After:
```tsx
                                    <Input
                                        id="partnerSecret"
                                        type="password"
                                        autoComplete="new-password"
                                        data-lpignore="true"
                                        data-1p-ignore=""
                                        data-bwignore=""
                                        className={partnerSecretDirty ? DIRTY_INPUT_CLS : undefined}
                                        value={activeLocalPartnerSecret}
                                        onChange={(e) => setActiveLocalPartnerSecret(e.target.value)}
                                        placeholder="test_partner_client_secret"
                                    />
```

Before:
```tsx
                                    <Input
                                        id="authAssertionMerchantId"
                                        value={activeLocalAuthAssertionMerchantId}
                                        onChange={(e) => setActiveLocalAuthAssertionMerchantId(e.target.value)}
                                        placeholder="test_partner_merchant_id"
                                    />
```

After:
```tsx
                                    <Input
                                        id="authAssertionMerchantId"
                                        className={merchantIdDirty ? DIRTY_INPUT_CLS : undefined}
                                        value={activeLocalAuthAssertionMerchantId}
                                        onChange={(e) => setActiveLocalAuthAssertionMerchantId(e.target.value)}
                                        placeholder="test_partner_merchant_id"
                                    />
```

- [ ] **Step 3: Apply the amber border to the 2 merchant-mode inputs**

Before:
```tsx
                                    <CredentialCombobox
                                        value={activeLocalClientId}
                                        onChange={handleClientIdChange}
                                        options={clientIdOptions}
                                        placeholder="Select or enter Client ID"
                                        inputType="text"
                                    />
```

After:
```tsx
                                    <CredentialCombobox
                                        value={activeLocalClientId}
                                        onChange={handleClientIdChange}
                                        options={clientIdOptions}
                                        placeholder="Select or enter Client ID"
                                        inputType="text"
                                        className={clientIdDirty ? DIRTY_INPUT_CLS : undefined}
                                    />
```

Before:
```tsx
                                    <CredentialCombobox
                                        value={activeLocalSecret}
                                        onChange={setActiveLocalSecret}
                                        options={secretOptions}
                                        placeholder="Select or enter Secret"
                                        inputType="password"
                                    />
```

After:
```tsx
                                    <CredentialCombobox
                                        value={activeLocalSecret}
                                        onChange={setActiveLocalSecret}
                                        options={secretOptions}
                                        placeholder="Select or enter Secret"
                                        inputType="password"
                                        className={secretDirty ? DIRTY_INPUT_CLS : undefined}
                                    />
```

- [ ] **Step 4: Highlight "Save Configuration" when dirty (both branches)**

This exact `<Button onClick={handleSave} ...>💾 Save Configuration</Button>` block appears twice — once in the partner branch, once in the merchant branch. Apply the SAME edit to BOTH occurrences.

Before (appears twice, identical):
```tsx
                                    <Button
                                        onClick={handleSave}
                                        className="shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        💾 Save Configuration
                                    </Button>
```

After (appears twice, identical):
```tsx
                                    <Button
                                        onClick={handleSave}
                                        className={`shadow-md hover:shadow-lg transition-shadow ${
                                            isDirty ? "ring-2 ring-amber-400 ring-offset-2 animate-pulse" : ""
                                        }`}
                                    >
                                        💾 Save Configuration
                                    </Button>
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. This repo has ~32 pre-existing unrelated baseline errors in other files (e.g. `components/ui/sidebar.tsx`, `db/vaultDb.ts`) — confirm the count is unchanged and none reference `SdkConfigPanel.tsx`.

- [ ] **Step 6: Manual verification**

Run `npm run dev` (or reuse an already-running dev server), open the home page:
1. In "一方 Merchant" mode: edit the Client ID field. Confirm its border turns amber immediately, and "Save Configuration" gets a pulsing amber ring.
2. Click "Save Configuration". Confirm the amber border on Client ID disappears and the button's pulse/ring stops (back to plain blue), since local state now matches the saved store value.
3. Edit the Secret field only — confirm only the Secret field shows the amber border (Client ID stays normal) while the Save button still pulses (aggregate `isDirty` is true because at least one field changed).
4. Switch to "三方 Partner" mode, repeat the same check on Partner Client ID, Partner Client Secret, and 授权 Merchant ID individually.
5. Toggle Sandbox ↔ Live — confirm dirty state is env-scoped (editing sandbox fields without saving, then switching to Live, should NOT show Live's fields as dirty, since they're compared against their own separate saved values).
6. Confirm Reset still works and clears the dirty indicators (after `handleReset`, local state matches the freshly-reset store defaults, so `isDirty` becomes false and no field shows an amber border).

- [ ] **Step 7: Commit**

```bash
git add components/panels/SdkConfigPanel.tsx
git commit -m "$(cat <<'EOF'
feat[2026-07-16]: SdkConfigPanel 未保存字段增加琥珀色提示

## 解决的问题
Credentials 区块的输入框改完不点 Save 不会生效，但之前没有任何视觉提示，容易让人以为改动已经生效。

## 主要改动
- components/panels/SdkConfigPanel.tsx: 新增按字段计算的 dirty 状态（对比当前输入值和已保存的 store 值），改动过的字段边框变琥珀色；只要当前可见分支里有任意字段未保存，Save Configuration 按钮就带脉冲高亮，保存后自动恢复正常

## 为什么这么改
复用现有 Live 环境警告已经用过的琥珀色语义，视觉上保持一致；用 Tailwind 内置的 animate-pulse，不需要新写动画；不加表单校验和离开页面确认，保持改动范围小（用户已确认这两点不需要）。
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** Design doc's "字段级 dirty 状态" → Step 1. "改动过的输入框边框变色" → Steps 2-3. "Save 按钮脉冲高亮" → Step 4. "不做校验/不做离开确认" → explicitly nothing added for those, matches design's "不做的事" section.
- **Type consistency:** `DIRTY_INPUT_CLS`, `clientIdDirty`, `secretDirty`, `partnerClientIdDirty`, `partnerSecretDirty`, `merchantIdDirty`, `isDirty` are used identically in both their declaration (Step 1) and consumption (Steps 2-4) — no naming drift.
- **No placeholders:** every step shows the exact before/after code; no "add similar logic" shortcuts.
