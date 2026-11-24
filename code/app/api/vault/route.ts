import { NextRequest, NextResponse } from "next/server";
import {
  listVaultMethods,
  createVaultMethod,
  type CreateVaultPayload,
} from "@/db/vaultDb";
import { getCfEnv } from "@/db/cf-env";

export const runtime = "edge";

export async function GET(_req: NextRequest) {
  try {
    const methods = await listVaultMethods(getCfEnv());
    return NextResponse.json({ methods });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateVaultPayload;
    if (!body.vault_id || !body.payment_type) {
      return NextResponse.json(
        { error: "vault_id and payment_type are required" },
        { status: 400 },
      );
    }
    const created = await createVaultMethod(getCfEnv(), body);
    return NextResponse.json({ method: created }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
