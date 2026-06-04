import toast from "react-hot-toast";
import consola from "consola";
import { createOrderAPIFactory, getOrderConfig } from "./order-utils";
import { getPayPalHeaders } from "./paypal-headers";


export async function getBrowserSafeClientToken(): Promise<string> {
	if (typeof window === "undefined") throw new Error("getBrowserSafeClientToken must be called in browser");

	const res = await fetch("/api/paypal/client-token", {
		headers: getPayPalHeaders(),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to fetch client token: ${text}`);
	}

	const json = await res.json();
	if (!json?.clientToken) throw new Error("No clientToken in response");
	return json.clientToken;
}

// 交易成功：简洁通知
export function handlePaymentSuccess(orderData?: any): void {
	if (typeof window === "undefined") return;
	const orderId = orderData?.id ?? orderData?.orderId ?? "";
	const txnId = orderData["capture"]["purchase_units"][0]["payments"]["captures"][0]["id"];
	const msg = orderId ? `Order Completed — Order No: ${orderId}. \n Txn:${txnId}` : "交易已完成。";
	toast.success(msg, { duration: 5000 });
}


/**
 * 在 captureOrder 之前调用，拿到 PayPal v2 order 的最新状态。
 * 主要用于 ACDC + 3DS 流程：根据 payment_source.card.authentication_result
 * (liability_shift / enrollment_status / authentication_status) 判断是否继续 capture。
 */
export async function getOrderDetail(orderIdObj: { orderId: string }): Promise<any> {
	if (typeof window === "undefined") throw new Error("getOrderDetail must be called in browser");

	const orderId = String(orderIdObj.orderId);
	if (!orderId) throw new Error("orderId is required to get order detail");
	consola.log("[getOrderDetail] OrderID:", orderId);

	const res = await fetch("/api/paypal/order/get/get-order", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...getPayPalHeaders(),
		},
		body: JSON.stringify({ orderId }),
	});

	const text = await res.text().catch(() => "");
	if (!res.ok) {
		const details = (() => {
			try { return JSON.parse(text); } catch { return text; }
		})();
		const err = new Error(`get order failed: ${res.status} ${JSON.stringify(details)}`);
		try { handlePaymentError(err); } catch { }
		throw err;
	}

	return text ? JSON.parse(text) : {};
}

// 交易失败：错误通知
export function handlePaymentError(error?: any): void {
	if (typeof window === "undefined") return;
	const msg =
		error?.message ?? (typeof error === "string" ? error : JSON.stringify(error ?? {}));
	toast.error(`交易失败：${msg || "请稍后重试。"}`, { duration: 7000 });
}

// 交易取消：中性提示
export function handlePaymentCancellation(): void {
	if (typeof window === "undefined") return;
	toast("交易已取消。", { icon: "⚠️", duration: 4000 });
}


export async function createOrder(): Promise<any> {
	return createOrderAPIFactory("/api/paypal/order/create/create-order", "paypal")();
}

export async function createOrderACDC(): Promise<any> {
	return createOrderAPIFactory("/api/paypal/order/create/create-order-ACDC", "card")();
}

export async function createEUROrder(): Promise<any> {
	return createOrderAPIFactory("/api/paypal/order/create/create-order-EUR", "paypal")();
}


export async function createPLNOrder(): Promise<any> {
	return createOrderAPIFactory("/api/paypal/order/create/create-order-PLN", "paypal")();
}

export async function createOrderOverallPayPal(url: string): Promise<any> {
	return createOrderAPIFactory(url, "paypal")();
}

export async function createOrderBCDC(): Promise<any> {
	return createOrderAPIFactory("/api/paypal/order/create/create-order-bcdc", "paypal")();
}

export async function createOrderRedirect(): Promise<any> {
	return createOrderAPIFactory("/api/paypal/order/create/create-order-redirect", "paypal")();
}

export async function createOrderGooglePay(): Promise<any> {
	return createOrderAPIFactory("/api/paypal/order/create/create-order", "google")();
}

export async function createOrderApplePay(): Promise<any> {
	return createOrderAPIFactory("/api/paypal/order/create/create-order", "apple")();
}

export async function createOrderWithVault(): Promise<any> {
	return createOrderAPIFactory("/api/paypal/order/create/create-order-paypal-one-time-payment-with-vault", "paypal")();
}


export async function createOrderWithVaultId(vaultId: string): Promise<any> {
	return createOrderAPIFactory("/api/paypal/order/create/create-order-paypal-with-vault-id", "paypal", { vault_id: vaultId })();
}


export async function customFindEligibleMethods(findEligibleMethodsPayload: any) {
	try {
		const response = await fetch("/api/paypal/find-eligible-methods", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...getPayPalHeaders(),
			},
			body: JSON.stringify(findEligibleMethodsPayload),
		});
		const jsonResponse = await response.json();
		consola.log(jsonResponse);
		consola.info("Custom Eligibility API call is successful")
		return jsonResponse;
	} catch (error) {
		consola.error("Custom Eligibility API failed")
	}
}

export async function createVaultSetupToken() {
	try {
		const response = await fetch("/api/paypal/vault/create-setup-token-for-paypal-save-payment", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				...getPayPalHeaders(),
			},
		});
		const jsonResponse = await response.json();
		const id = jsonResponse["setUpTokenId"]
		consola.log(jsonResponse);
		consola.info("Vault Setup Token API call is successful")
		return { vaultSetupToken: id };
	} catch (error) {
		consola.error("Vault Setup Token API failed")
		throw error;
	}
}

export async function createPaymentToken(vaultSetupTokenId: string) {
	try {
		const response = await fetch(
			"/api/paypal/vault/payment-token/create",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...getPayPalHeaders(),
				},
				body: JSON.stringify({ vaultSetupTokenId }),
			},
		);
		return await response.json();
	} catch (error) {
		consola.error("Vault Setup Token API failed")
		throw error;
	}
}


export async function captureOrder(orderIdObj: { orderId: string }): Promise<any> {
	if (typeof window === "undefined") throw new Error("captureOrder must be called in browser");

	consola.log("[captureOrder] OrderIdObj:", JSON.stringify(orderIdObj, null, "  "))
	const orderId = String(orderIdObj.orderId);
	if (!orderId) throw new Error("orderId is required to capture order");
	consola.log("[captureOrder] OrderID:", orderId)

	try {
		const res = await fetch("/api/paypal/order/capture/capture-order", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...getPayPalHeaders(),
			},
			body: JSON.stringify({ orderId }),
		});

		const text = await res.text().catch(() => "");
		if (!res.ok) {
			const details = (() => {
				try { return JSON.parse(text); } catch { return text; }
			})();
			const err = new Error(`capture failed: ${res.status} ${JSON.stringify(details)}`);
			handlePaymentError(err);
			throw err;
		}

		const json = text ? JSON.parse(text) : {};
		try {
			handlePaymentSuccess(json);
		} catch {
			// ignore UI handler errors
		}
		JSON.stringify("<Capture Result>:");
		JSON.stringify(json, null, "  ");
		return json;
	} catch (err: any) {
		try { handlePaymentError(err); } catch { }
		throw err;
	}
}
