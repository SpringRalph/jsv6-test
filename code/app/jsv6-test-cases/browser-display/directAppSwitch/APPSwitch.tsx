"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { useSdkInitOptions } from "@/hooks/useSdkInitOptions";
import {
    createOrderRedirect,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import { paymentSessionOptions } from "@/services/paypal-sdk-function/paypalSharedObject";
import { OneTimePaymentSession } from "@paypal/paypal-js/sdk-v6";
import { useEffect } from "react";


// SDK v6 runtime supports "direct-app-switch" although it is not in the
// @paypal/paypal-js v9.0.1 type union yet. Try app-switch first, then fall
// back to popup/modal when start() reports a recoverable error (e.g. desktop
// browser without the PayPal app installed).
const PRESENTATION_MODES_TO_TRY = ["direct-app-switch", "popup", "modal"] as const;

export default function APPSwitch() {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();

    function setupPayPalButton(paypalPaymentSession: OneTimePaymentSession) {
        const paypalButton = document.querySelector("#paypal-btn");
        if (!paypalButton) return;
        paypalButton.removeAttribute("hidden");

        paypalButton.addEventListener("click", async () => {
            // Create the order ONCE per click and reuse the same promise
            // across every presentation-mode fallback attempt — matches the
            // reference HTML so switching modes does not spawn duplicate orders.
            const createOrderPromise = createOrderRedirect();

            for (const presentationMode of PRESENTATION_MODES_TO_TRY) {
                try {
                    await paypalPaymentSession.start(
                        { presentationMode } as any,
                        createOrderPromise
                    );
                    break;
                } catch (err: any) {
                    console.warn(
                        `[APPSwitch] presentationMode "${presentationMode}" failed:`,
                        err
                    );
                    if (err?.isRecoverable) {
                        continue;
                    }
                    handlePaymentError(err);
                    throw err;
                }
            }
        });
    }

    useEffect(() => {
        // cancelled 用于在组件卸载或 effect 重新触发时中止异步流程，
        // 避免在已卸载的组件上做状态更新或重复初始化 SDK。
        let cancelled = false;

        if (!ready) return;

        (async () => {
            try {
                const initOptions = await getInitOptions();
                if (cancelled) return;

                const paypal = (window as any).paypal;

                const sdkInstance = await paypal?.createInstance?.({
                    ...initOptions,
                    components: ["paypal-payments"],
                    pageType: "checkout",
                });
                if (cancelled) {
                    if (sdkInstance?.destroy) sdkInstance.destroy();
                    return;
                }

                const paypalPaymentSession: OneTimePaymentSession =
                    sdkInstance.createPayPalOneTimePaymentSession(
                        paymentSessionOptions
                    );

                // After returning from the PayPal app, the SDK detects the
                // round trip via hasReturned(). Call resume() instead of
                // re-binding the button, otherwise the in-flight payment
                // session is dropped.
                if (paypalPaymentSession.hasReturned()) {
                    console.log("[APPSwitch] hasReturned=true → resume()");
                    await paypalPaymentSession.resume();
                } else {
                    console.log("[APPSwitch] hasReturned=false → setup button");
                    setupPayPalButton(paypalPaymentSession);
                }
            } catch (e) {
                if (!cancelled) console.error("[APPSwitch] init error:", e);
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