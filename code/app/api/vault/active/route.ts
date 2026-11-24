import { NextRequest, NextResponse } from "next/server";
import { getActiveVaultMethod } from "@/db/vaultDb";
import { getCfEnv } from "@/db/cf-env";

export const runtime = "edge";

export async function GET(_req: NextRequest) {
  try {
    const method = await getActiveVaultMethod(getCfEnv());
    if (!method) {
      return NextResponse.json({ error: "no active vault method" }, { status: 404 });
    }
    return NextResponse.json({ method });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
