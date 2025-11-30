"use client";

import { useCustomScript } from "@/hooks/useCustomScript";
import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import {
    getBrowserSafeClientToken,
} from "@/services/paypal-sdk-function/browser-function";

import React, { useEffect } from "react";
import { setupGooglePayButton } from "./GoolgePayFunction";

export default function ButtonBasic() {
    const { ready, loading, error } = usePayPalWebSdk();
    const {ready: googlePayReady, loading: googlePayLoading, error: googlePayError} = useCustomScript("https://pay.google.com/gp/p/js/pay.js");


    useEffect(() => {
        //cancelled 变量用于在组件卸载或 effect 被重新触发时中止异步流程，避免在已卸载的组件上做状态更新或继续创建/使用资源
        let cancelled = false;

        if (!ready || !googlePayReady) return;

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
                    components: ["googlepay-payments"],
                    pageType: "checkout",
                });

                setupGooglePayButton(sdkInstance);
              

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
    }, [ready, googlePayReady]);

    if (loading || googlePayLoading) return <div>正在加载支付SDK…</div>;
    if (error) return <div>PayPal SDK加载失败: {error.message}</div>;
    if (googlePayError) return <div>Google Pay SDK加载失败: {googlePayError.message}</div>;

    return (
        <div className="w-full min-h-[60px] flex items-center justify-center">
            <div id="googlepay-button-container"></div>
        </div>
    );
}
