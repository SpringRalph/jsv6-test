"use client";

import { useCustomScript } from "@/hooks/useCustomScript";
import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { getBrowserSafeClientToken } from "@/services/paypal-sdk-function/browser-function";

import React, { useEffect } from "react";
import { setupApplePayButton } from "./ApplePayFunction";

// 引入vConsole用于移动端调试
import VConsole from "vconsole";

export default function ButtonBasic() {
    const { ready, loading, error } = usePayPalWebSdk();
    const {
        ready: applePayReady,
        loading: applePayLoading,
        error: applePayError,
    } = useCustomScript(
        // "https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js"
        "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js"
    );

    useEffect(() => {
        //cancelled 变量用于在组件卸载或 effect 被重新触发时中止异步流程，避免在已卸载的组件上做状态更新或继续创建/使用资源
        let cancelled = false;

        // 初始化vConsole用于调试
        let vConsole: any = null;
        if (typeof window !== "undefined") {
            vConsole = new VConsole();
            console.log("vConsole initialized for debugging");
            console.log("ApplePay/applePay Component mounted");
        }

        if (!ready || !applePayReady) {
            console.log("SDK not ready:", { ready, applePayReady });
            return;
        }

        console.log("Both SDKs are ready, starting initialization...");

        (async () => {
            try {
                const clientToken = await getBrowserSafeClientToken();
                if (cancelled) return;

                const paypal = (window as any).paypal;
                // console.log(
                //     "PayPal SDK ready:",
                //     paypal,
                //     "clientToken:",
                //     clientToken
                // );

                console.log("Creating PayPal instance...");
                const sdkInstance = await paypal?.createInstance?.({
                    clientToken,
                    components: ["applepay-payments"],
                    pageType: "checkout",
                });

                console.log("PayPal instance created:", sdkInstance);

                setupApplePayButton(sdkInstance);

                if (cancelled) {
                    // 如果实例需要销毁，按需处理
                    if (sdkInstance?.destroy) sdkInstance.destroy();
                    return;
                }
            } catch (e) {
                console.error("PayPal init error:", e);
                if (vConsole) {
                    console.error("Detailed error in vConsole:", e);
                }
            }
        })();

        return () => {
            cancelled = true;
            console.log("Component unmounting, cleaning up...");
            // 销毁vConsole实例
            if (vConsole) {
                vConsole.destroy();
                console.log("vConsole destroyed");
            }
        };
    }, [ready, applePayReady]);

    if (loading || applePayLoading) return <div>正在加载支付SDK…</div>;
    if (error) return <div>PayPal SDK加载失败: {error.message}</div>;
    if (applePayError)
        return <div>apple Pay SDK加载失败: {applePayError.message}</div>;

    return (
        <div className="w-full min-h-[60px] flex items-center justify-center">
            <div id="applepay-button-container"></div>
        </div>
    );
}
