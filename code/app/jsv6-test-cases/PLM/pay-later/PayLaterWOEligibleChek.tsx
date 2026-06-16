"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { useSdkInitOptions } from "@/hooks/useSdkInitOptions";
import {
    createOrder,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import {
    AppSdkInstance,
    paymentSessionOptions,
} from "@/services/paypal-sdk-function/paypalSharedObject";
import { safeFindEligibleMethods } from "@/services/paypal-sdk-function/safe-find-eligible-methods";
import { useEffect } from "react";


import consola from "consola";

export default function PayLater() {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();

   

    // ============================================================

    // Setup Pay Later button
    async function setupPayLaterButton(sdkInstance: AppSdkInstance) {
        // debugger;
        const paylaterPaymentSession =
            sdkInstance.createPayLaterOneTimePaymentSession(
                paymentSessionOptions
            );

        const paylaterButton = document.querySelector(
            "#pay-later"
        )!;
        paylaterButton.setAttribute("productCode", "PAYLATER");
        paylaterButton.setAttribute("countryCode", "US");
        paylaterButton.removeAttribute("hidden");

        paylaterButton.addEventListener("click", async () => {
            try {
                await paylaterPaymentSession.start(
                    { presentationMode: "auto" }, // Auto-detects best presentation mode
                    createOrder()
                );
            } catch (error) {
                consola.error("PayLater payment start error:", error);
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
                const initOptions = await getInitOptions();
                if (cancelled) return;

                const paypal = (window as any).paypal;
                consola.debug(
                    "PayPal SDK ready:",
                    paypal,
                    "clientToken:",
                    initOptions
                );

                const sdkInstance = await paypal?.createInstance?.({
                    ...initOptions,
                    components: ["paypal-payments"],
                    pageType: "checkout",
                    testBuyerCountry: "US",
                });

                // 如果需check Paylater Eligible，取消 if 条件并实现 findEligibleMethods 逻辑
                if (!true) {
                    const paymentMethods =
                        await safeFindEligibleMethods(sdkInstance, {
                            currencyCode: "USD",
                        });
                    if (!paymentMethods) return;
                    if (paymentMethods.isEligible("paylater")) {
                         setupPayLaterButton(sdkInstance);
                    }
                } else {
                     setupPayLaterButton(sdkInstance);
                }

                if (cancelled) {
                    // 如果实例需要销毁，按需处理
                    if (sdkInstance?.destroy) sdkInstance.destroy();
                    return;
                }
            } catch (e) {
                if (!cancelled) consola.error("PayPal init error:", e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [ready]);

    if (loading) return <div>正在加载 PayPal SDK…</div>;
    if (error) return <div>PayPal SDK加载失败: {error.message}</div>;

    return (
        <div className="w-full min-h-[60px] flex items-center justify-center">
            <paypal-pay-later-button
                id="pay-later"
                hidden
            ></paypal-pay-later-button>
        </div>
    );
}
