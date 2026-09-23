import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LOCAL_DB_PATH = join(process.cwd(), "db", "vault-local.json");

type VaultPaymentMethod = {
  id: string;
  vault_id: string;
  customer_id: string | null;
  email: string | null;
  payment_type: string;
  card_brand: string | null;
  card_last_four: string | null;
  card_expiry: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

function readLocalDb(): VaultPaymentMethod[] {
  if (!existsSync(LOCAL_DB_PATH)) return [];
  return JSON.parse(readFileSync(LOCAL_DB_PATH, "utf-8")) as VaultPaymentMethod[];
}

function writeLocalDb(methods: VaultPaymentMethod[]): void {
  writeFileSync(LOCAL_DB_PATH, JSON.stringify(methods, null, 2) + "\n", "utf-8");
}

type Params = { params: Promise<{ id: string }> };

// PATCH /api/vault/:id  — set as active
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const now = new Date().toISOString();

    if (process.env.VAULT_STORAGE === "local") {
      const methods = readLocalDb();
      for (const m of methods) {
        m.is_active = m.id === id ? 1 : 0;
        m.updated_at = now;
      }
      writeLocalDb(methods);
      return NextResponse.json({ success: true });
    }

    const env = (process.env as any).__NEXT_CF_ENV__ ?? process.env;
    const { setActiveVaultMethod } = await import("@/db/vaultDb");
    await setActiveVaultMethod(env, id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/vault/:id
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    if (process.env.VAULT_STORAGE === "local") {
      const methods = readLocalDb().filter((m) => m.id !== id);
      writeLocalDb(methods);
      return NextResponse.json({ success: true });
    }

    const env = (process.env as any).__NEXT_CF_ENV__ ?? process.env;
    const { deleteVaultMethod } = await import("@/db/vaultDb");
    await deleteVaultMethod(env, id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}