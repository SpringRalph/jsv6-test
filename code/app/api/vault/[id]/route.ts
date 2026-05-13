import { NextRequest, NextResponse } from 'next/server';
import { setActiveVaultMethod, deleteVaultMethod } from '@/db/vaultDb';

export const runtime = 'edge';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/vault/:id  — set as active
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const env = (process.env as any).__NEXT_CF_ENV__ ?? process.env;
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
    const env = (process.env as any).__NEXT_CF_ENV__ ?? process.env;
    await deleteVaultMethod(env, id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
