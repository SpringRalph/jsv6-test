// Pure local-JSON vault storage. Only imported when VAULT_STORAGE=local.
// Uses node:fs so it only works in Node.js runtime (next dev / next start),
// never under Cloudflare Workers / wrangler.

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type PaymentType = "paypal" | "card" | "apple_pay" | "google_pay" | "venmo";

export interface VaultPaymentMethod {
  id: string;
  vault_id: string;
  customer_id: string | null;
  email: string | null;
  payment_type: PaymentType;
  card_brand: string | null;
  card_last_four: string | null;
  card_expiry: string | null;
  is_active: number;
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

const DB_PATH = join(process.cwd(), "db", "vault-local.json");

function read(): VaultPaymentMethod[] {
  if (!existsSync(DB_PATH)) return [];
  return JSON.parse(readFileSync(DB_PATH, "utf-8")) as VaultPaymentMethod[];
}

function write(methods: VaultPaymentMethod[]): void {
  writeFileSync(DB_PATH, JSON.stringify(methods, null, 2) + "\n", "utf-8");
}

export async function listVaultMethods(): Promise<VaultPaymentMethod[]> {
  const methods = read();
  methods.sort(
    (a, b) =>
      b.is_active - a.is_active ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return methods;
}

export async function getActiveVaultMethod(): Promise<VaultPaymentMethod | null> {
  return read().find((m) => m.is_active === 1) ?? null;
}

export async function createVaultMethod(payload: CreateVaultPayload): Promise<VaultPaymentMethod> {
  const now = new Date().toISOString();
  const method: VaultPaymentMethod = {
    id: crypto.randomUUID(),
    vault_id: payload.vault_id,
    customer_id: payload.customer_id ?? null,
    email: payload.email ?? null,
    payment_type: payload.payment_type,
    card_brand: payload.card_brand ?? null,
    card_last_four: payload.card_last_four ?? null,
    card_expiry: payload.card_expiry ?? null,
    is_active: 0,
    created_at: now,
    updated_at: now,
  };
  const methods = read();
  methods.push(method);
  write(methods);
  return method;
}

export async function setActiveVaultMethod(id: string): Promise<void> {
  const now = new Date().toISOString();
  const methods = read();
  for (const m of methods) {
    m.is_active = m.id === id ? 1 : 0;
    m.updated_at = now;
  }
  write(methods);
}

export async function deleteVaultMethod(id: string): Promise<void> {
  const methods = read().filter((m) => m.id !== id);
  write(methods);
}