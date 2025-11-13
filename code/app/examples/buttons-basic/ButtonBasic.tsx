"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { captureOrder, createOrder, getBrowserSafeClientToken, handlePaymentCancellation, handlePaymentError, handlePaymentSuccess } from "@/services/paypal-sdk-function/browser-function";
import React, { useEffect } from "react";

export default function ButtonBasic() {
    const { ready, loading, error } = usePayPalWebSdk();

    // Shared payment session options for all payment methods
    const paymentSessionOptions = {
        // Called when user approves a payment
        async onApprove(data: any) {
            console.log("Payment approved:", data);
            try {
                const orderData = await captureOrder({
                    orderId: data.orderId,
                });
                console.log("Payment captured successfully:", orderData);
                handlePaymentSuccess(orderData);
            } catch (error) {
                console.error("Payment capture failed:", error);
                handlePaymentError(error);
            }
        },

        // Called when user cancels a payment
        onCancel(data: any) {
            console.log("Payment cancelled:", data);
            handlePaymentCancellation();
        },

        // Called when an error occurs during payment
        onError(error: any) {
            console.error("Payment error:", error);
            handlePaymentError(error);
        },
    };

    // Setup standard PayPal button
    async function setupPayPalButton(sdkInstance: any) {
        const paypalPaymentSession =
            sdkInstance.createPayPalOneTimePaymentSession(
                paymentSessionOptions
            );

        const paypalButton = document.querySelector("paypal-button")!;
        paypalButton.removeAttribute("hidden");

        paypalButton.addEventListener("click", async () => {
            try {
                await paypalPaymentSession.start(
                    { presentationMode: "auto" }, // Auto-detects best presentation mode
                    createOrder()
                );
            } catch (error) {
                console.error("PayPal payment start error:", error);
                handlePaymentError(error);
            }
        });
    }

    useEffect(() => {
        //cancelled 变量用于在组件卸载或 effect 被重新触发时中止异步流程，避免在已卸载的组件上做状态更新或继续创建/使用资源
        let cancelled = false;

        if (!ready) return;

        (async () => {
            try {
                const clientToken = await getBrowserSafeClientToken();
                if (cancelled) return;

                const paypal = (window as any).paypal;
                console.log(
                    "PayPal SDK ready:",
                    paypal,
                    "clientToken:",
                    clientToken
                );

                const sdkInstance = await paypal?.createInstance?.({
                    clientToken,
                    components: ["paypal-payments"],
                    pageType: "checkout",
                });

                // Check eligibility for all payment methods
                const paymentMethods = await sdkInstance.findEligibleMethods({
                    currencyCode: "USD",
                });

                // Setup PayPal button if eligible
                if (paymentMethods.isEligible("paypal")) {
                    setupPayPalButton(sdkInstance);
                }

                if (cancelled) {
                    // 如果实例需要销毁，按需处理
                    if (sdkInstance?.destroy) sdkInstance.destroy();
                    return;
                }
            } catch (e) {
                if (!cancelled) console.error("PayPal init error:", e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [ready]);

    if (loading) return <div>正在加载 PayPal SDK…</div>;
    if (error) return <div>PayPal SDK加载失败: {error.message}</div>;

    // return <paypal-button type="pay" hidden></paypal-button>;

    return (
        <div className="w-full min-h-[60px] flex items-center justify-center">
            <paypal-button type="pay" hidden></paypal-button>
        </div>
    );
}
