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
                    onTemplateReady: (content: any) => {
                        // ANALYTICS LOG EXAMPLE
                        console.log("Cached Template Rendered");
                        //@ts-ignore
                        messageElement.setContent(content);
                    },
                    onContentReady: (content: any) => {
                        // ANALYTICS LOG EXAMPLE
                        console.log("Fetched Content Rendered");
                        //@ts-ignore
                        messageElement.setContent(content);
                    },
                });

                const learnMore = await messagesInstance.createLearnMore({
                    onShow: (content: any) => {
                        // ANALYTICS LOG EXAMPLE
                        console.log("Learn More Shown");
                    },
                    onApply: (content: any) => {
                        // ANALYTICS LOG EXAMPLE
                        console.log("Learn More Apply");
                    },
                    onClose: (content: any) => {
                        // ANALYTICS LOG EXAMPLE
                        console.log("Learn More Closed");
                    },
                });

                messageElement.addEventListener(
                    "paypal-message-click",
                    (event) => {
                        event.preventDefault();
                        //@ts-ignore
                        learnMore.open(event.detail.config);
                        // ANALYTICS LOG EXAMPLE
                        console.log("Message Learn More Clicked");
                    }
                );

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
        </div>
    );
}
