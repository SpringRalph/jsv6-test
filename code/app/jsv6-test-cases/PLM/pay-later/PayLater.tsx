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

export default function PayLater() {
    // async function setupPayLaterButton(
    //     sdkInstance: AppSdkInstance,
    //     paylaterPaymentMethodDetails: FindEligibleMethodsGetDetails<"paylater">
    // ) {
    //     // const paylaterPaymentSession =
    //     //     sdkInstance.createPayLaterOneTimePaymentSession({
    //     //         onApprove: paymentSessionOptions.onApprove
    //     //     });

    //     const paylaterPaymentSession =
    //         sdkInstance.createPayLaterOneTimePaymentSession(
    //             paymentSessionOptions
    //         );

    //     const { productCode, countryCode } = paylaterPaymentMethodDetails;
    //     const paylaterButton = document.querySelector("#paylater-button");

    //     if (paylaterButton && productCode && countryCode) {
    //         paylaterButton.setAttribute("productCode", productCode);
    //         paylaterButton.setAttribute("countryCode", countryCode);
    //         paylaterButton?.removeAttribute("hidden");

    //         paylaterButton?.addEventListener("click", async () => {
    //             try {
    //                 await paylaterPaymentSession.start(
    //                     { presentationMode: "auto" },
    //                     createOrder()
    //                 );
    //             } catch (error) {
    //                 console.error(error);
    //             }
    //         });
    //     }
    // }

    // useEffect(() => {
    //     (async () => {
    //         const paypalGlobalNamespace = await loadCoreSdkScript({
    //             environment: "sandbox",
    //         });

    //         try {
    //             const clientToken = await getBrowserSafeClientToken();
    //             const sdkInstance = await paypalGlobalNamespace.createInstance({
    //                 clientToken,
    //                 components: ["paypal-payments", "venmo-payments"],
    //                 pageType: "checkout",
    //                 testBuyerCountry: "US",
    //             });

    //             const paymentMethods = await sdkInstance.findEligibleMethods({
    //                 currencyCode: "USD",
    //             });

    //             if (paymentMethods.isEligible("paylater")) {
    //                 const paylaterPaymentMethodDetails =
    //                     paymentMethods.getDetails("paylater");
    //                 setupPayLaterButton(
    //                     sdkInstance,
    //                     paylaterPaymentMethodDetails
    //                 );
    //             }
    //         } catch (error) {
    //             console.error(error);
    //         }
    //     })();
    // });

    const { ready, loading, error } = usePayPalWebSdk();

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
                console.error("PayLater payment start error:", error);
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
        <div className="w-full min-h-[60px] flex items-center justify-center">
            <paypal-pay-later-button id="pay-later" hidden></paypal-pay-later-button>
        </div>
    );
}
