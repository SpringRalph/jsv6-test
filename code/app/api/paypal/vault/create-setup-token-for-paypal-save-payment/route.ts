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

export async function GET(req: Request) {
    consola.info("[/api/paypal/vault/create-setup-token-for-paypal-save-payment] HTTP POST received");
    try {
        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        consola.debug("------[1]------")
        const basic = buildBasicAuthHeader(clientId, clientSecret);


        consola.debug("------[2]------")


        const payload = {
            payment_source: {
                paypal: {
                    description:
                        "Description for PayPal to be shown to PayPal payer",
                    shipping: {
                        name: {
                            full_name: "Firstname Lastname",
                        },
                        address: {
                            address_line_1: "2211 N First Street",
                            address_line_2: "Building 17",
                            admin_area_2: "San Jose",
                            admin_area_1: "CA",
                            postal_code: "95131",
                            country_code: "US",
                        },
                    },
                    permit_multiple_payment_tokens: false,
                    usage_pattern: "IMMEDIATE",
                    usage_type: "MERCHANT",
                    customer_type: "CONSUMER",
                    experience_context: {
                        shipping_preference: "SET_PROVIDED_ADDRESS",
                        payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
                        brand_name: "EXAMPLE INC",
                        locale: "en-US",
                        return_url: "https://example.com/returnUrl",
                        cancel_url: "https://example.com/cancelUrl",
                    },
                },
            },
        };


        const setupRes = await fetch(`${base}/v3/vault/setup-tokens`, {
            method: "POST",
            headers: {
                Authorization: basic,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });



        const createText = await setupRes.text();

        // consola.info(createText)

        if (!setupRes.ok) {
            let details: any = createText;
            try {
                details = JSON.parse(createText);
            } catch {

            }
            return NextResponse.json(
                { error: "failed to create setup tokens", details },
                { status: 502 }
            );
        }

        const createJson = JSON.parse(createText);

        // consola.success(JSON.stringify(createJson, null, 2))

        return NextResponse.json({ setUpToken: createJson, setUpTokenId: createJson.id });
    } catch (err: any) {
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}