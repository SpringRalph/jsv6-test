import { buildBasicAuthHeader, getPayPalConfig, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
import { NextResponse } from "next/server";
import consola from "consola";

export const runtime = 'edge';

type Item = {
    id?: string;
    name: string;
    unitPrice: number;
    quantity: number;
};

export async function POST(req: Request) {
    consola.info("[/api/paypal/vault/payment-token/create] HTTP POST received");
    try {
        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        consola.debug("------[1]------")
        const basic = buildBasicAuthHeader(clientId, clientSecret);


        consola.debug("------[2]------")
        const { vaultSetupTokenId } = await req.json().catch(() => null);

        const payload = {
            payment_source: {
                token: {
                    id: vaultSetupTokenId,
                    type: "SETUP_TOKEN",
                },
            },
        };



        const res = await fetch(`${base}/v3/vault/payment-tokens`, {
            method: "POST",
            headers: {
                Authorization: basic,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });



        const text = await res.text();

        consola.info(text)

        if (!res.ok) {
            let details: any = text;
            try {
                details = JSON.parse(text);
            } catch {

            }
            return NextResponse.json(
                { error: "failed to create payment tokens", details },
                { status: 502 }
            );
        }

        const json = JSON.parse(text);

        consola.success(JSON.stringify(json, null, 2))

        return NextResponse.json({ paymentToken: json, paymentTokenId: json.id });
    } catch (err: any) {
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}