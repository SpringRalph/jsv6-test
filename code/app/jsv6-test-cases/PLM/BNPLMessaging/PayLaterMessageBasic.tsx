"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import {
    createOrder,
    getBrowserSafeClientToken,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";

import { useCartTotal } from "@/store/useCartStore";

import React, { useEffect, useState } from "react";

export default function PayLaterMessageBasic() {
    const { ready, loading, error } = usePayPalWebSdk();
    const total = useCartTotal()

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
                    components: ["paypal-messages"],
                    pageType: "checkout",
                });

                sdkInstance.createPayPalMessages();

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

    console.log("totolAmount:",total)
    return (
        <div className="w-full min-h-[60px] flex items-center justify-center">
            <paypal-message
                id="paypal-message"
                auto-bootstrap
                amount={String(total)}
                currency-code="USD"
                text-color="MONOCHROME"
                logo-position="TOP"
            ></paypal-message>
        </div>
    );
}
