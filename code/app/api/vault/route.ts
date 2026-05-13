import { NextRequest, NextResponse } from 'next/server';
import { listVaultMethods, createVaultMethod, type CreateVaultPayload } from '@/db/vaultDb';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const env = (process.env as any).__NEXT_CF_ENV__ ?? process.env;
    const methods = await listVaultMethods(env);
    return NextResponse.json({ methods });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CreateVaultPayload;
    if (!body.vault_id || !body.payment_type) {
      return NextResponse.json({ error: 'vault_id and payment_type are required' }, { status: 400 });
    }
    const env = (process.env as any).__NEXT_CF_ENV__ ?? process.env;
    const created = await createVaultMethod(env, body);
    return NextResponse.json({ method: created }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
