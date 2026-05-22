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
import { OneTimePaymentSession } from "@paypal/paypal-js/sdk-v6";
import { useEffect } from "react";
import consola from "consola";

export default function PaymentHandlerBtn() {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();

    // Setup standard PayPal button
    async function setupPayPalButton(sdkInstance: AppSdkInstance) {
        const paypalPaymentSession: OneTimePaymentSession =
            sdkInstance.createPayPalOneTimePaymentSession(
                paymentSessionOptions
            );

        const paypalButton = document.querySelector("#paypal-btn")!;
        paypalButton.removeAttribute("hidden");

        paypalButton.addEventListener("click", async () => {
            const presentationModesToTry = [
                "payment-handler",
                "popup",
                "modal",
            ];
            for (const presentationMode of presentationModesToTry) {
                try {
                    await paypalPaymentSession.start(
                        //@ts-ignore
                        { presentationMode: presentationMode },
                        createOrder()
                    );
                    break;
                } catch (error: any) {
                    if (error.isRecoverable) {
                        continue;
                    }
                    consola.error("PayPal payment start error:", error);
                    handlePaymentError(error);
                    throw error;
                }
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
                    "initOptions:",
                    initOptions
                );

                const sdkInstance = await paypal?.createInstance?.({
                    ...initOptions,
                    components: ["paypal-payments"],
                    pageType: "checkout",
                });

                setupPayPalButton(sdkInstance);

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
            <paypal-button id="paypal-btn" type="pay" hidden></paypal-button>
        </div>
    );
}
