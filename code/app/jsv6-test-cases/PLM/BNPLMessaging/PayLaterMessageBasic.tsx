"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { useSdkInitOptions } from "@/hooks/useSdkInitOptions";
import {
    createOrder,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";

import { useCartTotal } from "@/store/useCartStore";
import { Switch } from "@/components/ui/switch";

import React, { useEffect, useState } from "react";
import consola from "consola";

export default function PayLaterMessageBasic() {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();
    const total = useCartTotal();
    const [buyerCountryEnabled, setBuyerCountryEnabled] = useState(true);

    useEffect(() => {
        //cancelled 变量用于在组件卸载或 effect 被重新触发时中止异步流程，避免在已卸载的组件上做状态更新或继续创建/使用资源
        let cancelled = false;
        let currentSdkInstance: any = null;

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
                    components: ["paypal-messages"],
                    pageType: "checkout",
                });

                if (cancelled) {
                    if (sdkInstance?.destroy) sdkInstance.destroy();
                    return;
                }

                currentSdkInstance = sdkInstance;
                sdkInstance.createPayPalMessages(
                    buyerCountryEnabled ? { buyerCountry: "US" } : {},
                );
            } catch (e) {
                if (!cancelled) consola.error("PayPal init error:", e);
            }
        })();

        // toggle 切换时会重新触发本 effect，这里负责销毁上一次的实例，
        // 配合下方 <paypal-message key> 的重新挂载，确保组件真正刷新
        return () => {
            cancelled = true;
            if (currentSdkInstance?.destroy) currentSdkInstance.destroy();
        };
    }, [ready, buyerCountryEnabled]);

    if (loading) return <div>正在加载 PayPal SDK…</div>;
    if (error) return <div>PayPal SDK加载失败: {error.message}</div>;

    consola.log("totolAmount:", total);
    return (
        <div className="w-full flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
                <Switch
                    id="buyer-country-toggle"
                    checked={buyerCountryEnabled}
                    onCheckedChange={setBuyerCountryEnabled}
                />
                <label htmlFor="buyer-country-toggle" className="text-sm">
                    Buyer Country: US {buyerCountryEnabled ? "(开启)" : "(关闭)"}
                </label>
            </div>
            <div className="w-full min-h-[60px] flex items-center justify-center">
                <paypal-message
                    key={String(buyerCountryEnabled)}
                    id="paypal-message"
                    auto-bootstrap
                    amount={String(total)}
                    currency-code="USD"
                    text-color="MONOCHROME"
                    logo-position="TOP"
                ></paypal-message>
            </div>
        </div>
    );
}
