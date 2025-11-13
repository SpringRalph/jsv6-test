import { buildBasicAuthHeader, getPayPalConfig } from "@/services/paypal-server-side-function/server-function";
import consola from "consola";
import { NextResponse } from "next/server";

export async function GET() {
    console.log("  --[/api/paypal/client-token]: HTTP REQUEST received")
    const { clientId, clientSecret, base } = getPayPalConfig();

    const form = new URLSearchParams();
    form.append("grant_type", "client_credentials");
    form.append("response_type", "client_token")

    try {
        const auth = buildBasicAuthHeader(clientId, clientSecret);
        const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
            method: "POST",
            headers: {
                Authorization: auth,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: form.toString()
        });
      
        if (!tokenRes.ok) {
            const text = await tokenRes.text();
            return NextResponse.json({ error: "failed to obtain access token", details: text }, { status: 502 });
        }

        const tokenJson = await tokenRes.json();
        const accessToken = tokenJson.access_token;
        if (!accessToken) return NextResponse.json({ error: "no access token returned" }, { status: 502 });

        consola.log("[/api/paypal/client-token]: access_token:", accessToken)
        return NextResponse.json({ clientToken: accessToken });

    } catch (err: any) {

        return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
    }
}