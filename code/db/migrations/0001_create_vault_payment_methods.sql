-- Cloudflare D1 Migration: vault_payment_methods
-- Run: wrangler d1 execute <DB_NAME> --file=db/migrations/0001_create_vault_payment_methods.sql

CREATE TABLE IF NOT EXISTS vault_payment_methods (
  id          TEXT PRIMARY KEY,           -- 本地生成的 UUID (crypto.randomUUID)
  vault_id    TEXT NOT NULL UNIQUE,       -- PayPal vaultSetupToken / paymentTokenId
  customer_id TEXT,                       -- PayPal customer ID
  email       TEXT,                       -- 用户邮箱 (PayPal账户)

  -- 支付方式类型: 'paypal' | 'card' | 'apple_pay' | 'google_pay' | 'venmo'
  payment_type TEXT NOT NULL DEFAULT 'paypal',

  -- 卡类型专属字段 (card时填写，其余为 NULL)
  card_brand      TEXT,   -- e.g. VISA, MASTERCARD, AMEX
  card_last_four  TEXT,   -- e.g. 4242
  card_expiry     TEXT,   -- e.g. 2027-12

  -- 状态标记
  is_active   INTEGER NOT NULL DEFAULT 0,  -- 1 = 当前 active，同一时间只有一条为 1
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 保证同一时间只有一个 active vault
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active
  ON vault_payment_methods (is_active)
  WHERE is_active = 1;

-- 常用查询索引
CREATE INDEX IF NOT EXISTS idx_vault_customer ON vault_payment_methods (customer_id);
CREATE INDEX IF NOT EXISTS idx_vault_type     ON vault_payment_methods (payment_type);
