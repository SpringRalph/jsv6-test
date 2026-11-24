import { NextRequest, NextResponse } from "next/server";
import { setActiveVaultMethod, deleteVaultMethod } from "@/db/vaultDb";
import { getCfEnv } from "@/db/cf-env";

export const runtime = "edge";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await setActiveVaultMethod(getCfEnv(), id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await deleteVaultMethod(getCfEnv(), id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
