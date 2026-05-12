import toast from "react-hot-toast";
import consola from "consola";
import { createOrderAPIFactory, getOrderConfig } from "./order-utils";


export async function getBrowserSafeClientToken(): Promise<string> {
	if (typeof window === "undefined") throw new Error("getBrowserSafeClientToken must be called in browser");

	const res = await fetch("/api/paypal/client-token");
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


export async function getOrderDetail() {

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

export async function createPayPalOverAllOrder(url: string): Promise<any> {
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


export async function createOrderWithVaultId(): Promise<any> {
	return createOrderAPIFactory("/api/paypal/order/create/create-order-paypal-with-vault-id", "paypal")();
}


export async function customFindEligibleMethods(findEligibleMethodsPayload: any) {
	try {
		const response = await fetch("/api/paypal/find-eligible-methods", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
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
				},
				body: JSON.stringify({ vaultSetupTokenId }),
			},
		);
		const data = await response.json();

		return data;
	} catch (error) {
		consola.error("Vault Setup Token API failed")
		throw error;
	}
}


export async function captureOrder(orderIdObj: { orderId: string }): Promise<any> {
	if (typeof window === "undefined") throw new Error("captureOrder must be called in browser");


	consola.log("[captureOrder] OrderIdObj:", JSON.stringify(orderIdObj, null, "  "))
	// debugger;
	const orderId = String(orderIdObj.orderId);
	if (!orderId) throw new Error("orderId is required to capture order");
	consola.log("[captureOrder] OrderID:", orderId)

	try {
		const res = await fetch("/api/paypal/order/capture/capture-order", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ orderId }),
		});

		const text = await res.text().catch(() => "");
		if (!res.ok) {
			const details = (() => {
				try { return JSON.parse(text); } catch { return text; }
			})();
			const err = new Error(`capture failed: ${res.status} ${JSON.stringify(details)}`);
			// 调用失败通知
			handlePaymentError(err);
			throw err;
		}

		const json = text ? JSON.parse(text) : {};
		// 成功：调用成功处理器并返回结果
		try {
			handlePaymentSuccess(json);
		} catch {
			// ignore UI handler errors
		}
		return json;
	} catch (err: any) {
		// 网络或其它异常时调用错误处理器
		try { handlePaymentError(err); } catch { }
		throw err;
	}
}
