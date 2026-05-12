"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import {
    createOrderWithVaultId,
    getBrowserSafeClientToken,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import {
    AppSdkInstance,
    enhancedPaymentSessionOptions,
    paymentSessionOptions,
} from "@/services/paypal-sdk-function/paypalSharedObject";

import React, { useEffect, useState } from "react";
import consola from "consola";
import toast from "react-hot-toast";
import { OnApproveDataOneTimePayments } from "@paypal/paypal-js/sdk-v6";
import { ColorConsoleHelper } from "@/lib/colorConsoleHelper";
import { EligibilityOverlay } from "@/components/ui/EligibilityOverlay";

export default function ButtonBasic() {
    const { ready, loading, error } = usePayPalWebSdk();
    const [isInitializing, setIsInitializing] = useState(false);

    // Setup standard PayPal button
    async function setupPayPalButton(sdkInstance: AppSdkInstance) {
        const paypalPaymentSession =
            sdkInstance.createPayPalOneTimePaymentSession(
                paymentSessionOptions,
            );

        const paypalButton = document.querySelector("#paypal-btn")!;
        paypalButton.removeAttribute("hidden");

        const createOrderPromise = createOrderWithVaultId();

        paypalButton.addEventListener("click", async () => {
            try {
                await paypalPaymentSession.start(
                    { presentationMode: "auto" }, // Auto-detects best presentation mode
                    createOrderPromise,
                );
            } catch (error) {
                consola.error("PayPal payment start error:", error);
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
                consola.log(
                    "PayPal SDK ready:",
                    paypal,
                    "clientToken:",
                    clientToken,
                );

                const sdkInstance = await paypal?.createInstance?.({
                    clientToken,
                    components: ["paypal-payments"],
                    pageType: "checkout",
                });

                setIsInitializing(true);
                try {
                    const paymentMethods =
                        await sdkInstance.findEligibleMethods({
                            currencyCode: "USD",
                        });
                    if (paymentMethods.isEligible("paypal")) {
                        setupPayPalButton(sdkInstance);
                    }
                } finally {
                    setIsInitializing(false);
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
        <div className="relative w-full min-h-[60px] flex items-center justify-center">
            <EligibilityOverlay
                isVisible={isInitializing}
                message="Checking PayPal Eligibility…"
            />
            <paypal-button id="paypal-btn" type="pay" hidden></paypal-button>
        </div>
    );
}
