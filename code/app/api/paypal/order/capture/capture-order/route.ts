import { buildBasicAuthHeader, getPayPalConfig } from "@/services/paypal-server-side-function/server-function";
import consola from "consola";
import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: Request) {
	try {
		const { clientId, clientSecret, base } = getPayPalConfig();
		const basic = buildBasicAuthHeader(clientId, clientSecret);

		const body = await req.json().catch(() => null);
		if (!body || !body.orderId) {
			return NextResponse.json({ error: "orderId is required in request body" }, { status: 400 });
		}

		const orderId = String(body.orderId);
		consola.log("[CAPTURE-ORDER]: orderID:", orderId)

		const captureRes = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
			method: "POST",
			headers: {
				Authorization: basic,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			// PayPal 接口允许空 body；留空或传 {} 均可
			body: JSON.stringify({}),
		});

		const text = await captureRes.text();

		if (!captureRes.ok) {
			let details: any = text;
			try {
				details = JSON.parse(text);
			} catch {
				/* keep raw text */
			}
			return NextResponse.json(
				{ error: "failed to capture order", status: captureRes.status, details },
				{ status: 502 }
			);
		}

		const json = text ? JSON.parse(text) : {};
		// 返回捕获结果（包含 capture id 等信息）
		return NextResponse.json({ capture: json, orderId: orderId });
	} catch (err: any) {
		return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
	}
}