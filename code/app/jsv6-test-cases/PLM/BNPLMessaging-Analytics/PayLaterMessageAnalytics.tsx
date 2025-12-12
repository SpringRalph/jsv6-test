"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import {
    createOrder,
    getBrowserSafeClientToken,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";

import { useCartTotal } from "@/store/useCartStore";

import React, { useEffect, useState } from "react";

export default function PayLaterMessageAnalytics() {
    const { ready, loading, error } = usePayPalWebSdk();
    const total = useCartTotal();

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

                const messagesInstance = sdkInstance.createPayPalMessages();
                const messageElement =
                    document.querySelector("#paypal-message")!;

                sdkInstance.createPayPalMessages({
                    buyerCountry: "US",
                    currencyCode: "USD",
                });

                const content = await messagesInstance.fetchContent({
                    //@ts-ignore
                    ...messageElement.getFetchContentOptions(),
                    textColor: "MONOCHROME",
                    amount: String(total),
                    currencyCode: "USD",
                    onReady: (content: any) => {
                        //@ts-ignore
                        messageElement.setContent(content);
                    },
                });

                function triggerAmountUpdate(amount: string) {
                    console.log("Amount:", amount);
                    content.update({ amount });
                }

                document
                    .querySelector("#refresh-message-btn")!
                    .addEventListener("click", () => {
                        triggerAmountUpdate(String(total));
                    });

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

    console.log("totolAmount:", total);
    return (
        <div className="w-full min-h-[60px] flex items-center justify-center flex-col">
            <paypal-message id="paypal-message"></paypal-message>
            <button
                id="refresh-message-btn"
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
            >
                Refresh Message
            </button>
        </div>
    );
}
