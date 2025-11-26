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

import React, { useEffect } from "react";

export default function Venmo() {
    const { ready, loading, error } = usePayPalWebSdk();

    // Setup Venmo button
    async function setupVenmoButton(sdkInstance: AppSdkInstance) {
        const venmoPaymentSession =
            sdkInstance.createVenmoOneTimePaymentSession(
                paymentSessionOptions
            );

        const venmoButton = document.querySelector("#venmo-button")!;
        venmoButton.removeAttribute("hidden");

        // get the promise reference by invoking createOrder()
        // do not await this async function since it can cause transient activation issues
        const createOrderPromise = createOrder();

        venmoButton.addEventListener("click", async () => {
            try {
                await venmoPaymentSession.start(
                    { presentationMode: "auto" }, // Auto-detects best presentation mode
                    createOrderPromise
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
                    components: ["venmo-payments"],
                    pageType: "checkout",
                });

                if (!true) {
                    // ####################### 进行eligibility check ###############################

                    // Check eligibility for all payment methods
                    const paymentMethods =
                        await sdkInstance.findEligibleMethods({
                            currencyCode: "USD",
                        });

                    // debugger;

                    // Setup PayPal button if eligible
                    if (paymentMethods.isEligible("venmo")) {
                        setupVenmoButton(sdkInstance);
                    }

                    // ############################################################################
                } else {
                    setupVenmoButton(sdkInstance);
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

    return (
        <div className="w-full min-h-[60px] flex items-center justify-center">
             <venmo-button id="venmo-button" type="pay" hidden></venmo-button>
        </div>
    );
}
