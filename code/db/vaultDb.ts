export type PaymentType = 'paypal' | 'card' | 'apple_pay' | 'google_pay' | 'venmo';

export interface VaultPaymentMethod {
  id: string;
  vault_id: string;
  customer_id: string | null;
  email: string | null;
  payment_type: PaymentType;
  card_brand: string | null;
  card_last_four: string | null;
  card_expiry: string | null;
  is_active: number; // 0 | 1
  created_at: string;
  updated_at: string;
}

export interface CreateVaultPayload {
  vault_id: string;
  customer_id?: string;
  email?: string;
  payment_type: PaymentType;
  card_brand?: string;
  card_last_four?: string;
  card_expiry?: string;
}

function generateId(): string {
  return crypto.randomUUID();
}

function getDb(env: Record<string, unknown>): D1Database {
  const db = env['DB'] as D1Database | undefined;
  if (!db) throw new Error('D1 database binding "DB" is not configured in wrangler.toml');
  return db;
}

export async function listVaultMethods(env: Record<string, unknown>): Promise<VaultPaymentMethod[]> {
  const db = getDb(env);
  const { results } = await db
    .prepare('SELECT * FROM vault_payment_methods ORDER BY is_active DESC, created_at DESC')
    .all<VaultPaymentMethod>();
  return results;
}

export async function getActiveVaultMethod(env: Record<string, unknown>): Promise<VaultPaymentMethod | null> {
  const db = getDb(env);
  return db
    .prepare('SELECT * FROM vault_payment_methods WHERE is_active = 1 LIMIT 1')
    .first<VaultPaymentMethod>();
}

export async function createVaultMethod(
  env: Record<string, unknown>,
  payload: CreateVaultPayload,
): Promise<VaultPaymentMethod> {
  const db = getDb(env);
  const id = generateId();
  const now = new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO vault_payment_methods
        (id, vault_id, customer_id, email, payment_type,
         card_brand, card_last_four, card_expiry, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `)
    .bind(
      id,
      payload.vault_id,
      payload.customer_id ?? null,
      payload.email ?? null,
      payload.payment_type,
      payload.card_brand ?? null,
      payload.card_last_four ?? null,
      payload.card_expiry ?? null,
      now,
      now,
    )
    .run();

  return db
    .prepare('SELECT * FROM vault_payment_methods WHERE id = ?')
    .bind(id)
    .first<VaultPaymentMethod>() as Promise<VaultPaymentMethod>;
}

export async function setActiveVaultMethod(
  env: Record<string, unknown>,
  id: string,
): Promise<void> {
  const db = getDb(env);
  const now = new Date().toISOString();
  // 先全部清除 active，再设置指定行
  await db.batch([
    db.prepare('UPDATE vault_payment_methods SET is_active = 0, updated_at = ?').bind(now),
    db.prepare('UPDATE vault_payment_methods SET is_active = 1, updated_at = ? WHERE id = ?').bind(now, id),
  ]);
}

export async function deleteVaultMethod(
  env: Record<string, unknown>,
  id: string,
): Promise<void> {
  const db = getDb(env);
  await db.prepare('DELETE FROM vault_payment_methods WHERE id = ?').bind(id).run();
}
