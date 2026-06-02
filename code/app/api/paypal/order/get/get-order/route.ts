import {
    buildBasicAuthHeader,
    getPayPalConfigFromRequest,
} from "@/services/paypal-server-side-function/server-function";
import consola from "consola";
import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * POST /api/paypal/order/get/get-order
 * Body: { orderId: string }
 *
 * Proxies PayPal v2 `GET /v2/checkout/orders/{id}` so the browser can inspect
 * the order (status / 3DS authentication_result / payment_source.card etc.)
 * after `cardSession.submit()` resolves but BEFORE capturing.
 */
export async function POST(req: Request) {
    try {
        const { clientId, clientSecret, base } = getPayPalConfigFromRequest(req);
        const basic = buildBasicAuthHeader(clientId, clientSecret);

        const body = await req.json().catch(() => null);
        if (!body || !body.orderId) {
            return NextResponse.json(
                { error: "orderId is required in request body" },
                { status: 400 },
            );
        }

        const orderId = String(body.orderId);
        consola.log("[GET-ORDER]: orderID:", orderId);

        const getRes = await fetch(
            `${base}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
            {
                method: "GET",
                headers: {
                    Authorization: basic,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            },
        );

        const text = await getRes.text();

        if (!getRes.ok) {
            let details: any = text;
            try {
                details = JSON.parse(text);
            } catch {
                /* keep raw text */
            }
            return NextResponse.json(
                {
                    error: "failed to get order",
                    status: getRes.status,
                    details,
                },
                { status: 502 },
            );
        }

        const json = text ? JSON.parse(text) : {};
        return NextResponse.json({ order: json, orderId });
    } catch (err: any) {
        return NextResponse.json(
            { error: "internal error", details: String(err) },
            { status: 500 },
        );
    }
}
