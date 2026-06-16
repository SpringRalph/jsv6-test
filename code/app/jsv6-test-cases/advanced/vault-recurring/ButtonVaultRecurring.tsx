"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { useSdkInitOptions } from "@/hooks/useSdkInitOptions";
import {
    createOrderWithVaultId,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import {
    AppSdkInstance,
    enhancedPaymentSessionOptions,
    paymentSessionOptions,
} from "@/services/paypal-sdk-function/paypalSharedObject";
import { safeFindEligibleMethods } from "@/services/paypal-sdk-function/safe-find-eligible-methods";

import React, { useEffect, useState } from "react";
import consola from "consola";
import toast from "react-hot-toast";
import { OnApproveDataOneTimePayments } from "@paypal/paypal-js/sdk-v6";
import { ColorConsoleHelper } from "@/lib/colorConsoleHelper";
import { EligibilityOverlay } from "@/components/ui/EligibilityOverlay";

export default function ButtonBasic() {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();
    const [isInitializing, setIsInitializing] = useState(false);

    // Setup standard PayPal button
    async function setupPayPalButton(sdkInstance: AppSdkInstance) {
        const paypalPaymentSession =
            sdkInstance.createPayPalOneTimePaymentSession(
                paymentSessionOptions,
            );

        const paypalButton = document.querySelector("#paypal-btn")!;
        paypalButton.removeAttribute("hidden");

        paypalButton.addEventListener("click", async () => {
            try {
                const vaultRes = await fetch("/api/vault/active");
                if (!vaultRes.ok) {
                    toast.error("No active vault method found. Please set one in Vault Manager.");
                    return;
                }
                const { method } = await vaultRes.json();
                const createOrderPromise = createOrderWithVaultId(method.vault_id);

                await paypalPaymentSession.start(
                    { presentationMode: "auto" },
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
                const initOptions = await getInitOptions();
                if (cancelled) return;

                const paypal = (window as any).paypal;
                consola.log(
                    "PayPal SDK ready:",
                    paypal,
                    "clientToken:",
                    initOptions,
                );

                const sdkInstance = await paypal?.createInstance?.({
                    ...initOptions,
                    components: ["paypal-payments"],
                    pageType: "checkout",
                });

                setIsInitializing(true);
                try {
                    const paymentMethods =
                        await safeFindEligibleMethods(sdkInstance, {
                            currencyCode: "USD",
                        });
                    if (!paymentMethods) return;
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
