import { buildBasicAuthHeader, buildPayPalRequestHeaders, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
import { NextResponse } from "next/server";
import consola from "consola";

export const runtime = 'edge';

type Item = {
    id?: string;
    name: string;
    unitPrice: number;
    quantity: number;
};

function generate32CharId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    const extraRandom = Math.random().toString(36).substring(2, 7);
    return (timestamp + randomPart + extraRandom).padEnd(32, '0').slice(0, 32);
}

export async function POST(req: Request) {
    consola.info("[/api/paypal/order/create/create-order-instant] HTTP POST received");
    try {
        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        const basic = buildBasicAuthHeader(clientId, clientSecret);

        const body = await req.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: "invalid request body" }, { status: 400 });
        }

        const items: Item[] = Array.isArray(body.items) ? body.items : [];
        const totalAmount: number = Number(body.totalAmount ?? 0);
        const currency: string = String(body.currency ?? "USD").toUpperCase();
        const paymentDetail = body.paymentDetail ?? {};

        if (items.length === 0 || totalAmount <= 0) {
            return NextResponse.json(
                { error: "items or totalAmount missing/invalid" },
                { status: 400 }
            );
        }

        const paypalItems = items.map((it) => ({
            name: it.name,
            unit_amount: { currency_code: currency, value: it.unitPrice.toFixed(2) },
            quantity: String(it.quantity),
            sku: it.id ?? undefined,
        }));

        const purchaseUnit = {
            amount: {
                currency_code: currency,
                value: totalAmount.toFixed(2),
                breakdown: {
                    item_total: {
                        currency_code: currency,
                        value: totalAmount.toFixed(2),
                    },
                },
            },
            items: paypalItems,
        };

        const vaultId = paymentDetail.vault_id as string | undefined;
        const fraudnetId = paymentDetail.fraudnet_id as string | undefined;

        if (!vaultId || typeof vaultId !== "string" || !vaultId.trim()) {
            return NextResponse.json({ error: "vault_id is required" }, { status: 400 });
        }

        const orderBody: Record<string, any> = {
            intent: "CAPTURE",
            purchase_units: [purchaseUnit],
            payment_source: {
                paypal: {
                    vault_id: vaultId,
                    stored_credential: {
                        payment_initiator: "CUSTOMER",
                        usage_pattern: "IMMEDIATE",
                        usage: "SUBSEQUENT",
                    },
                },
            },
        };

        consola.debug(JSON.stringify(orderBody, null, "  "));

        const extraHeaders: Record<string, string> = {
            "PayPal-Request-Id": generate32CharId(),
        };
        if (fraudnetId) {
            extraHeaders["PayPal-Client-Metadata-Id"] = fraudnetId;
        }

        const createRes = await fetch(`${base}/v2/checkout/orders`, {
            method: "POST",
            headers: buildPayPalRequestHeaders(req, basic, extraHeaders),
            body: JSON.stringify(orderBody),
        });

        const createText = await createRes.text();
        if (!createRes.ok) {
            let details: any = createText;
            try { details = JSON.parse(createText); } catch { /* raw text */ }
            return NextResponse.json(
                { error: "failed to create paypal order", details },
                { status: 502 }
            );
        }

        const createJson = JSON.parse(createText);
        return NextResponse.json({ order: createJson, orderId: createJson.id });
    } catch (err: any) {
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}