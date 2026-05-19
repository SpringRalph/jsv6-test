import { buildBasicAuthHeader, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
import { NextResponse } from "next/server";
import consola from "consola";

export const runtime = 'edge';

async function getAccessToken(base: string, basic: string): Promise<string> {
    const res = await fetch(`${base}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: basic,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });
    if (!res.ok) throw new Error(`Failed to get access token: ${res.status}`);
    const json = await res.json();
    return json.access_token;
}

async function createProduct(base: string, token: string): Promise<string> {
    const res = await fetch(`${base}/v1/catalogs/products`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: "Sample Subscription Product",
            description: "Sample product for subscription testing",
            type: "SERVICE",
            category: "SOFTWARE",
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create product: ${text}`);
    }
    const json = await res.json();
    return json.id;
}

async function createBillingPlan(base: string, token: string, productId: string): Promise<string> {
    const res = await fetch(`${base}/v1/billing/plans`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
        },
        body: JSON.stringify({
            product_id: productId,
            name: "Sample Monthly Plan",
            description: "9.99/month subscription",
            status: "ACTIVE",
            billing_cycles: [
                {
                    frequency: { interval_unit: "MONTH", interval_count: 1 },
                    tenure_type: "REGULAR",
                    sequence: 1,
                    total_cycles: 0,
                    pricing_scheme: {
                        fixed_price: { currency_code: "USD", value: "9.99" },
                    },
                },
            ],
            payment_preferences: {
                auto_bill_outstanding: true,
                setup_fee: { currency_code: "USD", value: "0.00" },
                payment_failure_threshold: 3,
            },
        }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create billing plan: ${text}`);
    }
    const json = await res.json();
    return json.id;
}

export async function POST(req: Request) {
    consola.info("[/api/paypal/subscription/create] HTTP POST received");
    try {
        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        const basic = buildBasicAuthHeader(clientId, clientSecret);

        const body = await req.json().catch(() => ({}));

        // Use planId from request body, then env var, then auto-create
        let planId: string = body.planId ?? process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID ?? "";

        if (!planId) {
            consola.info("No planId configured — creating product and billing plan on the fly");
            const accessToken = await getAccessToken(base, basic);
            const productId = await createProduct(base, accessToken);
            consola.info("Created product:", productId);
            planId = await createBillingPlan(base, accessToken, productId);
            consola.info("Created billing plan:", planId);
        }

        const createRes = await fetch(`${base}/v1/billing/subscriptions`, {
            method: "POST",
            headers: {
                Authorization: basic,
                "Content-Type": "application/json",
                Accept: "application/json",
                Prefer: "return=minimal",
            },
            body: JSON.stringify({
                plan_id: planId,
                application_context: {
                    brand_name: "EXAMPLE INC",
                    locale: "en-US",
                    shipping_preference: "NO_SHIPPING",
                    user_action: "SUBSCRIBE_NOW",
                },
            }),
        });

        const createText = await createRes.text();
        if (!createRes.ok) {
            let details: any = createText;
            try { details = JSON.parse(createText); } catch { }
            consola.error("PayPal subscription create failed:", details);
            return NextResponse.json(
                { error: "failed to create subscription", details },
                { status: 502 }
            );
        }

        const createJson = JSON.parse(createText);
        consola.info("Subscription created:", createJson.id);
        return NextResponse.json(createJson);
    } catch (err: any) {
        consola.error("Subscription create error:", err);
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}
