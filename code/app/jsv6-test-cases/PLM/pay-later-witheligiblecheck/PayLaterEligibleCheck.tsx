"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import {
    createOrder,
    getBrowserSafeClientToken,
} from "@/services/paypal-sdk-function/browser-function";
import {
    AppSdkInstance,
    paymentSessionOptions,
} from "@/services/paypal-sdk-function/paypalSharedObject";
import { useEffect, useState } from "react";

import { type FindEligibleMethodsGetDetails } from "@paypal/paypal-js/sdk-v6";
import consola from "consola";
import { ColorConsoleHelper } from "@/lib/colorConsoleHelper";
import { EligibilityOverlay } from "@/components/ui/EligibilityOverlay";

export default function PayLater() {
    const { ready, loading, error } = usePayPalWebSdk();
    const [isInitializing, setIsInitializing] = useState(false);

    async function setupPayLaterButton(
        sdkInstance: AppSdkInstance,
        paylaterPaymentMethodDetails: FindEligibleMethodsGetDetails<"paylater">,
    ) {
        const paylaterPaymentSession =
            sdkInstance.createPayLaterOneTimePaymentSession(
                paymentSessionOptions,
            );

        const { productCode, countryCode } = paylaterPaymentMethodDetails;
        consola.log("productCode", productCode);
        consola.log("countryCode", countryCode);

        //!! PAY ATTENTION !!
        // The button element in this test case has id "pay-later"
        // Not "paypal-pay-later-button" as the Component name
        const paylaterButton = document.querySelector("#pay-later");
        consola.log("paylaterButton found:", paylaterButton);

        if (paylaterButton && productCode && countryCode) {
            paylaterButton.setAttribute("productCode", productCode);
            paylaterButton.setAttribute("countryCode", countryCode);
            paylaterButton?.removeAttribute("hidden");

            paylaterButton?.addEventListener("click", async () => {
                try {
                    await paylaterPaymentSession.start(
                        { presentationMode: "auto" },
                        createOrder(),
                    );
                } catch (error) {
                    consola.error(error);
                }
            });
        }
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
                    clientToken,
                );

                const sdkInstance = await paypal?.createInstance?.({
                    clientToken,
                    components: ["paypal-payments"],
                    pageType: "checkout",
                    testBuyerCountry: "US",
                });

                const eligibleCheckStart = performance.now();
                setIsInitializing(true);
                const paymentMethods = await sdkInstance.findEligibleMethods({
                    currencyCode: "USD",
                });
                setIsInitializing(false);
                ColorConsoleHelper.cyan(
                    `findEligibleMethods took ${(performance.now() - eligibleCheckStart).toFixed(2)} ms`,
                    16,
                );

                consola.success("Payment Methods Eligible check:");
                console.table(
                    ["paylater", "paypal", "venmo"].map((code) => {
                        const isEligible = paymentMethods.isEligible(code);
                        const details = isEligible
                            ? paymentMethods.getDetails(code)
                            : null;
                        return { code, isEligible, details };
                    }),
                );

                if (paymentMethods.isEligible("paylater")) {
                    const paylaterPaymentMethodDetails =
                        paymentMethods.getDetails("paylater");

                    consola.success("Paylater Payment Method Details:");
                    consola.log(paylaterPaymentMethodDetails);

                    setupPayLaterButton(
                        sdkInstance,
                        paylaterPaymentMethodDetails,
                    );
                }

                if (cancelled) {
                    // 如果实例需要销毁，按需处理
                    if (sdkInstance?.destroy) sdkInstance.destroy();
                    return;
                }
            } catch (e) {
                if (!cancelled) consola.error("PayPal init error:", e);
            } finally {
                if (!cancelled) {
                    setIsInitializing(false);
                }
            }
        })();

        return () => {
            cancelled = true;
           
        };
    }, [ready]);

    if (loading) return <div>正在加载 PayPal SDK…</div>;
    if (error) return <div>PayPal SDK加载失败: {error.message}</div>;

    return (
        <div className="relative w-full min-h-[120px] flex items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50/70">
            <EligibilityOverlay
                isVisible={isInitializing}
                message="Checking PayLater Eligibility…"
            />

            <paypal-pay-later-button
                id="pay-later"
                hidden
            ></paypal-pay-later-button>
        </div>
    );
}
