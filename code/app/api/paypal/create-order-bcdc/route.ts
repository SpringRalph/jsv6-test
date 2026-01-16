import { buildBasicAuthHeader, getPayPalConfig } from "@/services/paypal-server-side-function/server-function";
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
    consola.info("[/api/paypal/create-order] HTTP POST received");
    try {
        const { clientId, clientSecret, base } = getPayPalConfig();
        console.log("------[1]------")
        const basic = buildBasicAuthHeader(clientId, clientSecret);

        const body = await req.json().catch(() => null);
        console.log("------[2]------")

        console.log(JSON.stringify(body, null, "  "))

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

        console.log("------[3]------")
        // 组装 PayPal v2 order body
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
            "shipping": {
                "type": "SHIPPING",
                "method": "DHL",
                "name": {
                    "full_name": "John Doe"
                },
                "address": {
                    "address_line_1": "1600 Amphitheatre Parkway",
                    "address_line_2": "Suite 100",
                    "postal_code": "94043",
                    "admin_area_2": "Mountain View",
                    "country_code": "US",
                    "admin_area_1": "CA"
                }
            }
        };

        const orderBody: Record<string, any> = {
            intent: "CAPTURE",
            purchase_units: [purchaseUnit],

        };

        if (paymentDetail.payment_source) {
            const return_url = paymentDetail["endpoint"]["return_url"]
            const cancel_url = paymentDetail["endpoint"]["cancel_url"]
            const payment_source = {
                [paymentDetail.payment_source]: {
                    "experience_context": {
                        "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
                        "brand_name": "EXAMPLE INC",
                        "locale": "en-US",
                        "landing_page": "LOGIN",
                        "shipping_preference": "SET_PROVIDED_ADDRESS",
                        "user_action": "PAY_NOW",
                        "return_url": return_url,
                        "cancel_url": cancel_url,

                    },
                    "name": {
                        "given_name": "John",
                        "surname": "Doe"
                    },
                    "address": {
                        "address_line_1": "1600 Amphitheatre Parkway",
                        "address_line_2": "Suite 100",
                        "postal_code": "94043",
                        "admin_area_2": "Mountain View",
                        "country_code": "US",
                        "admin_area_1": "CA"
                    },
                    "email_address": "test@test.com",
                    "phone": {
                        "phone_type": "MOBILE",
                        "phone_number": {
                            "national_number": "4085551234"
                        }
                    }
                }
            };

            orderBody["payment_source"] = payment_source

        }


        console.log(JSON.stringify(orderBody, null, "  "))

        const createRes = await fetch(`${base}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                Authorization: basic,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(orderBody),
        });

        const createText = await createRes.text();
        if (!createRes.ok) {
            let details: any = createText;
            try {
                details = JSON.parse(createText);
            } catch {

            }
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