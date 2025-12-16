"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import {
    createOrder,
    getBrowserSafeClientToken,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import {
    AppSdkInstance,
    paymentSessionOptions,
} from "@/services/paypal-sdk-function/paypalSharedObject";
import { useEffect } from "react";

import {
    type FindEligibleMethodsGetDetails,
    loadCoreSdkScript,
} from "@paypal/paypal-js/sdk-v6";
import consola from "consola";

export default function PayLaterWithCustonButton() {
    const { ready, loading, error } = usePayPalWebSdk();

    // Setup Pay Later button
    async function setupPayLaterButton(sdkInstance: AppSdkInstance) {
        // debugger;
        const paylaterPaymentSession =
            sdkInstance.createPayLaterOneTimePaymentSession(
                paymentSessionOptions
            );

        const paylaterButton = document.querySelector("#merchant-button")!;
        paylaterButton.setAttribute("productCode", "PAYLATER");
        paylaterButton.setAttribute("countryCode", "US");

        paylaterButton.addEventListener("click", async () => {
            try {
                await paylaterPaymentSession.start(
                    { presentationMode: "auto" }, // Auto-detects best presentation mode
                    createOrder()
                );
            } catch (error) {
                console.error("PayLater payment start error:", error);
                handlePaymentError(error);
            }
        });

        // Show the merchant button after everything is set up
        paylaterButton.classList.remove("hidden");
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
                consola.debug(
                    "PayPal SDK ready:",
                    paypal,
                    "clientToken:",
                    clientToken
                );

                const sdkInstance = await paypal?.createInstance?.({
                    clientToken,
                    components: ["paypal-payments"],
                    pageType: "checkout",
                    testBuyerCountry: "US",
                });

                setupPayLaterButton(sdkInstance);

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

    return (
        <div className="w-full min-h-[60px] flex items-center justify-center pt-4">
            <sdk-custom-button-wrapper funding-source="paypal">
                <button
                    id="merchant-button"
                    className="px-6 py-3 bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold rounded-full shadow-lg hover:from-blue-500 hover:to-purple-600 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 hidden relative overflow-hidden group animate-bounce"
                >
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-full"></span>
                    <div className="flex items-center justify-center space-x-2">
                        <img
                            src="/payment-area-icon/disney.svg"
                            alt="Disney Icon"
                            className="w-8 h-8 ml-2 transform group-hover:rotate-12 transition-transform duration-300"
                        />
                        <span>Merchant Pay Later Button</span>
                    </div>
                </button>
            </sdk-custom-button-wrapper>
        </div>
    );
}
