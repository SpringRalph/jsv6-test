import { NextResponse } from 'next/server';
import type { VaultPaymentMethod } from '@/db/vaultDb';

export const runtime = 'edge';

const MOCK_METHODS: VaultPaymentMethod[] = [
  {
    id: 'mock-001',
    vault_id: 'A21AAKZ3XPGJQ',
    customer_id: 'C2JSPKWTX',
    email: 'sb-buyer@personal.example.com',
    payment_type: 'paypal',
    card_brand: null,
    card_last_four: null,
    card_expiry: null,
    is_active: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'mock-002',
    vault_id: 'B87XPLM2QRST9',
    customer_id: 'C2JSPKWTX',
    email: null,
    payment_type: 'card',
    card_brand: 'VISA',
    card_last_four: '4242',
    card_expiry: '2027-12',
    is_active: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'mock-003',
    vault_id: 'C99NQWER7YUIO',
    customer_id: null,
    email: null,
    payment_type: 'google_pay',
    card_brand: null,
    card_last_four: null,
    card_expiry: null,
    is_active: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ methods: MOCK_METHODS });
}
