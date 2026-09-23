import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "node:fs";
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

export async function GET(_req: NextRequest) {
  try {
    if (process.env.VAULT_STORAGE === "local") {
      const method = readLocalDb().find((m) => m.is_active === 1) ?? null;
      if (!method) {
        return NextResponse.json({ error: "no active vault method" }, { status: 404 });
      }
      return NextResponse.json({ method });
    }

    // D1 path — only reached under wrangler dev
    const env = (process.env as any).__NEXT_CF_ENV__ ?? process.env;
    const db = env["DB"];
    if (!db) throw new Error('D1 database binding "DB" is not configured');
    const { getActiveVaultMethod } = await import("@/db/vaultDb");
    const method = await getActiveVaultMethod(env);
    if (!method) {
      return NextResponse.json({ error: "no active vault method" }, { status: 404 });
    }
    return NextResponse.json({ method });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}