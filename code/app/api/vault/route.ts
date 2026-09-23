import { NextRequest, NextResponse } from "next/server";

type PaymentType = "paypal" | "card" | "apple_pay" | "google_pay" | "venmo";

interface VaultPaymentMethod {
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

// ── shared local-json helpers ───────────────────────────

async function getEnv(req: NextRequest) {
  // D1 is only available under wrangler dev (Cloudflare Workers runtime).
  // Under next dev we detect a bare Node.js runtime and switch to a local
  // JSON-file store.
  if (process.env.VAULT_STORAGE === "local") return { backend: "local" as const };

  const env = (process.env as any).__NEXT_CF_ENV__ ?? process.env;
  const db = env["DB"] as unknown;
  if (db != null) return { backend: "d1" as const, env };
  return { backend: "local" as const };
}

async function readLocalDb(): Promise<VaultPaymentMethod[]> {
  const { readFileSync, existsSync } = await import("node:fs");
  const { join } = await import("node:path");
  const path = join(process.cwd(), "db", "vault-local.json");
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, "utf-8")) as VaultPaymentMethod[];
}

async function writeLocalDb(methods: VaultPaymentMethod[]): Promise<void> {
  const { writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const path = join(process.cwd(), "db", "vault-local.json");
  writeFileSync(path, JSON.stringify(methods, null, 2) + "\n", "utf-8");
}

// ── GET /api/vault ─────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const ctx = await getEnv(req);
    if (ctx.backend === "local") {
      const methods = await readLocalDb();
      methods.sort(
        (a, b) =>
          b.is_active - a.is_active ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      return NextResponse.json({ methods });
    }

    const { listVaultMethods } = await import("@/db/vaultDb");
    const methods = await listVaultMethods(ctx.env);
    return NextResponse.json({ methods });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── POST /api/vault ────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vault_id, payment_type, customer_id, email, card_brand, card_last_four, card_expiry } = body || {};
    if (!vault_id || !payment_type) {
      return NextResponse.json({ error: "vault_id and payment_type are required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const ctx = await getEnv(req);

    if (ctx.backend === "local") {
      const methods = await readLocalDb();
      const method: VaultPaymentMethod = {
        id: crypto.randomUUID(),
        vault_id,
        customer_id: customer_id ?? null,
        email: email ?? null,
        payment_type,
        card_brand: card_brand ?? null,
        card_last_four: card_last_four ?? null,
        card_expiry: card_expiry ?? null,
        is_active: 0,
        created_at: now,
        updated_at: now,
      };
      methods.push(method);
      await writeLocalDb(methods);
      return NextResponse.json({ method }, { status: 201 });
    }

    const { createVaultMethod } = await import("@/db/vaultDb");
    const created = await createVaultMethod(ctx.env, body as any);
    return NextResponse.json({ method: created }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}