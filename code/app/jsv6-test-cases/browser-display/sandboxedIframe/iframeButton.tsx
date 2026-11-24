"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { useSdkInitOptions } from "@/hooks/useSdkInitOptions";
import {
    captureOrder,
    createOrder,
    handlePaymentCancellation,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import { postToHost } from "@/lib/iframeBridge";
import { useCartStore } from "@/store/useCartStore";
import { useEffect } from "react";
import consola from "consola";

function toReceipt(orderId: string, orderData: any) {
    const capture = orderData?.capture?.purchase_units?.[0]?.payments?.captures?.[0];
    return {
        orderId: String(orderData?.id ?? orderData?.orderId ?? orderId),
        txnId: String(capture?.id ?? ""),
        status: String(capture?.status ?? orderData?.capture?.status ?? orderData?.status ?? ""),
        amount: String(capture?.amount?.value ?? ""),
        currency: String(capture?.amount?.currency_code ?? ""),
    };
}

export default function IframeButtonTest() {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();

    useEffect(() => {
        let cancelled = false;
        let detach: (() => void) | undefined;

        if (!ready) return;

        (async () => {
            try {
                const initOptions = await getInitOptions();
                if (cancelled) return;

                const sdkInstance = await (window as any).paypal?.createInstance?.({
                    ...initOptions,
                    components: ["paypal-payments"],
                    pageType: "checkout",
                });
                if (cancelled) return;

                const session = sdkInstance.createPayPalOneTimePaymentSession({
                    async onApprove(data: any) {
                        const orderId = data.orderId ?? data.data?.orderId;
                        try {
                            const orderData = await captureOrder({ orderId });
                            postToHost({ type: "payment:approved", payload: toReceipt(orderId, orderData) });
                        } catch (e: any) {
                            handlePaymentError(e);
                            postToHost({ type: "payment:error", payload: { message: String(e?.message ?? e) } });
                        }
                    },
                    onCancel(data: any) {
                        handlePaymentCancellation();
                        postToHost({ type: "payment:cancelled", payload: { orderId: data?.orderId } });
                    },
                    onError(e: any) {
                        handlePaymentError(e);
                        postToHost({ type: "payment:error", payload: { message: String(e?.message ?? e) } });
                    },
                });

                const button = document.querySelector("#paypal-btn")!;
                button.removeAttribute("hidden");

                const onClick = async () => {
                    const { product, quantity } = useCartStore.getState();
                    postToHost({
                        type: "payment:start",
                        payload: { quantity, total: Number((product.price * quantity).toFixed(2)) },
                    });
                    try {
                        await session.start({ presentationMode: "auto" }, createOrder());
                    } catch (e: any) {
                        consola.error("PayPal payment start error:", e);
                        handlePaymentError(e);
                        postToHost({ type: "payment:error", payload: { message: String(e?.message ?? e) } });
                    }
                };

                button.addEventListener("click", onClick);
                detach = () => button.removeEventListener("click", onClick);
            } catch (e) {
                if (!cancelled) consola.error("PayPal init error:", e);
            }
        })();

        return () => {
            cancelled = true;
            detach?.();
        };
    }, [ready]);

    if (loading) return <div>正在加载 PayPal SDK…</div>;
    if (error) return <div>PayPal SDK加载失败: {error.message}</div>;

    return (
        <div className="w-full min-h-[60px] flex items-center justify-center">
            <paypal-button id="paypal-btn" type="pay" hidden></paypal-button>
        </div>
    );
}
