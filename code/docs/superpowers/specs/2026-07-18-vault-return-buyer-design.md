# Vault Return Buyer — Edit-FI & Instant Payment Scenario

**Date**: 2026-07-18
**Status**: approved

## Overview

新增 `vault-return-buyer` scenario，覆盖回头客两种支付路径：

1. **一键即时支付（Pay Now in one click）**：`vault_id` + `stored_credential` 同步捕获，无弹窗
2. **Edit-FI（查看/编辑已保存的支付方式）**：`paypal-saved-payment-methods` 组件 + `createPayPalEditSavedPaymentSession`，`commit: false`，审批后手动捕获

Vault ID / Customer ID 自动从 `/api/vault/active` 拉取并回显在输入框中，允许手动修改。

## Files

### New files

| File | Description |
|------|-------------|
| `app/jsv6-test-cases/advanced/vault-return-buyer/page.tsx` | Page layout: standard two-column with ProductPanel + CartSummary left, PaymentPlaceholder right |
| `app/jsv6-test-cases/advanced/vault-return-buyer/ButtonReturnBuyer.tsx` | Client component: SDK init, SPM element, Pay Now button, Execute Order button |
| `app/api/paypal/order/create/create-order-instant/route.ts` | Server endpoint: creates order with `vault_id` + `stored_credential` at top level |
| `app/api/paypal/order/create/create-order-edit-fi/route.ts` | Server endpoint: creates order with `experience_context.preferred_payment_source.vault_id` |

### Modified files

| File | Change |
|------|--------|
| `app/api/paypal/client-token/route.ts` | Accept optional `vaultId` query param; when present, append `&claims[]=vault_id:<vaultId>` to OAuth token request |
| `services/paypal-sdk-function/browser-function.ts` | Add `createOrderInstant(vaultId, fraudnetId)` and `createOrderEditFi(vaultId)` frontend helpers |

## API Endpoints

### `GET /api/paypal/client-token?vaultId=<id>`

When `vaultId` is present and non-empty, append to OAuth form body:

```
&claims[]=vault_id:<vaultId>
```

When absent, behavior unchanged (plain client token).

### `POST /api/paypal/order/create/create-order-instant`

Request body (from browser):

```json
{
  "vaultId": "<vault_id>",
  "fraudnetId": "<fraudnet_session_id>"
}
```

Creates PayPal order:

```json
{
  "intent": "CAPTURE",
  "purchase_units": [{ "amount": { ... } }],
  "payment_source": {
    "paypal": {
      "vault_id": "<vaultId>",
      "stored_credential": {
        "payment_initiator": "CUSTOMER",
        "usage_pattern": "IMMEDIATE",
        "usage": "SUBSEQUENT"
      }
    }
  }
}
```

Headers: `PayPal-Client-Metadata-Id` set to `fraudnetId` when non-empty.

Response includes order status; if `COMPLETED`, frontend skips separate capture.

### `POST /api/paypal/order/create/create-order-edit-fi`

Request body (from browser):

```json
{
  "vaultId": "<vault_id>"
}
```

Creates PayPal order:

```json
{
  "intent": "CAPTURE",
  "purchase_units": [{ "amount": { ... } }],
  "payment_source": {
    "paypal": {
      "experience_context": {
        "return_url": "...",
        "cancel_url": "...",
        "preferred_payment_source": { "vault_id": "<vaultId>" }
      }
    }
  }
}
```

## Component Logic (ButtonReturnBuyer.tsx)

### State

- `vaultId` / `customerId`: from active vault, editable in inputs
- `approvedOrderId`: set by edit session onApprove, cleared on capture or re-init
- `sdkInstance`: the scoped SDK instance

### Initialization flow

1. `usePayPalWebSdk()` → wait for SDK script ready
2. Fetch active vault from `/api/vault/active` → populate vaultId/customerId inputs
3. Fetch vault-scoped client token from `/api/paypal/client-token?vaultId=...`
4. `window.paypal.createInstance({ clientToken, components: ["paypal-payments", "paypal-saved-payment-methods", "paypal-messages"] })`
5. `findEligibleMethods()` → if eligible, wire up buttons + SPM

### SPM / Edit-FI setup

1. Create `<paypal-saved-payment-methods>` element, append to DOM
2. Create session: `sdkInstance.createPayPalEditSavedPaymentSession({ commit: false, onApprove, onCancel, onError })`
3. `el.addEventListener("click", () => session.start({ presentationMode: "auto" }, createEditOrder(vaultId)))`
4. Show "Execute Order" button in `onApprove`, which calls `captureOrder({ orderId: approvedOrderId })`

### Pay Now (Instant) setup

1. Button click → `chargeVaultInstant()`
2. `chargeVaultInstant()`: fetch `createOrderInstant.php`-equivalent → if `COMPLETED` done, else `captureOrder()`

### Vault input re-initialization

When user changes vault ID and clicks "Set" (or similar), re-run initialization with the new vault ID — invalidates `approvedOrderId` and recreates SDK instance.

## FraudNet

- Pay Now button: includes fraudnet session ID in request body; server attaches as `PayPal-Client-Metadata-Id` header
- Edit-FI: no FraudNet (buyer-facing approval popup provides risk challenge opportunity)

## Error handling

- Each functional block (Pay Now setup, Edit-FI setup, messaging) in independent try/catch
- `safeFindEligibleMethods` wrapper returns null on failure (shows global error dialog)
- Capture failures surfaced via toast
- Empty vault ID: Pay Now button shows warning toast, does not proceed