import { NextRequest, NextResponse } from 'next/server';
import { getActiveVaultMethod } from '@/db/vaultDb';

export const runtime = 'edge';

export async function GET(_req: NextRequest) {
  try {
    const env = (process.env as any).__NEXT_CF_ENV__ ?? process.env;
    const method = await getActiveVaultMethod(env);
    if (!method) {
      return NextResponse.json({ error: 'no active vault method' }, { status: 404 });
    }
    return NextResponse.json({ method });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
