import { buildBasicAuthHeader, buildPayPalRequestHeaders, getPayPalConfigFromRequest } from "@/services/paypal-server-side-function/server-function";
import { NextResponse } from "next/server";
import consola from "consola";

export const runtime = 'edge';

async function getAccessToken(base: string, basic: string, req: Request): Promise<string> {
    const res = await fetch(`${base}/v1/oauth2/token`, {
        method: "POST",
        headers: buildPayPalRequestHeaders(req, basic, { "Content-Type": "application/x-www-form-urlencoded" }),
        body: "grant_type=client_credentials",
    });
    if (!res.ok) throw new Error(`Failed to get access token: ${res.status}`);
    const json = await res.json();
    return json.access_token;
}

function requirePartnerMode(req: Request): NextResponse | null {
    if (!req.headers.get("x-paypal-auth-assertion")) {
        return NextResponse.json(
            { error: "Apple Pay domain registration requires partner (three-party) integration mode" },
            { status: 400 }
        );
    }
    return null;
}

export async function GET(req: Request) {
    consola.info("[/api/paypal/apple-pay/domain-registration] HTTP GET received");
    const guardErr = requirePartnerMode(req);
    if (guardErr) return guardErr;

    try {
        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        const basic = buildBasicAuthHeader(clientId, clientSecret);
        const accessToken = await getAccessToken(base, basic, req);

        const res = await fetch(`${base}/v1/customer/wallet-domains`, {
            method: "GET",
            headers: buildPayPalRequestHeaders(req, `Bearer ${accessToken}`),
        });

        const text = await res.text();
        if (!res.ok) {
            let details: any = text;
            try { details = JSON.parse(text); } catch { }
            consola.error("PayPal wallet-domains list failed:", details);
            return NextResponse.json({ error: "failed to list domains", details }, { status: 502 });
        }

        const json = JSON.parse(text);
        return NextResponse.json({ domains: json.wallet_domains ?? [] });
    } catch (err: any) {
        consola.error("Apple Pay domain list error:", err);
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    consola.info("[/api/paypal/apple-pay/domain-registration] HTTP POST received");
    const guardErr = requirePartnerMode(req);
    if (guardErr) return guardErr;

    try {
        const body = await req.json().catch(() => null);
        const domain: string = body?.domain;
        if (!domain) {
            return NextResponse.json({ error: "domain is required" }, { status: 400 });
        }

        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        const basic = buildBasicAuthHeader(clientId, clientSecret);
        const accessToken = await getAccessToken(base, basic, req);

        const res = await fetch(`${base}/v1/customer/wallet-domains`, {
            method: "POST",
            headers: buildPayPalRequestHeaders(req, `Bearer ${accessToken}`),
            body: JSON.stringify({
                provider_type: "APPLE_PAY",
                domain: { name: domain },
            }),
        });

        const text = await res.text();
        if (!res.ok) {
            let details: any = text;
            try { details = JSON.parse(text); } catch { }
            consola.error("PayPal wallet-domains register failed:", details);
            return NextResponse.json({ error: "failed to register domain", details }, { status: 502 });
        }

        const json = text ? JSON.parse(text) : {};
        return NextResponse.json(json);
    } catch (err: any) {
        consola.error("Apple Pay domain register error:", err);
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    consola.info("[/api/paypal/apple-pay/domain-registration] HTTP DELETE received");
    const guardErr = requirePartnerMode(req);
    if (guardErr) return guardErr;

    try {
        const body = await req.json().catch(() => null);
        const domain: string = body?.domain;
        if (!domain) {
            return NextResponse.json({ error: "domain is required" }, { status: 400 });
        }
        const reason: string = body?.reason || "Merchant requested to deregister domain";

        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        const basic = buildBasicAuthHeader(clientId, clientSecret);
        const accessToken = await getAccessToken(base, basic, req);

        const res = await fetch(`${base}/v1/customer/unregister-wallet-domain`, {
            method: "POST",
            headers: buildPayPalRequestHeaders(req, `Bearer ${accessToken}`),
            body: JSON.stringify({
                provider_type: "APPLE_PAY",
                domain: { name: domain },
                reason,
            }),
        });

        const text = await res.text();
        if (!res.ok) {
            let details: any = text;
            try { details = JSON.parse(text); } catch { }
            consola.error("PayPal wallet-domains deregister failed:", details);
            return NextResponse.json({ error: "failed to deregister domain", details }, { status: 502 });
        }

        const json = text ? JSON.parse(text) : {};
        return NextResponse.json(json);
    } catch (err: any) {
        consola.error("Apple Pay domain deregister error:", err);
        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}
