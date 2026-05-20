"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { getBrowserSafeClientToken } from "@/services/paypal-sdk-function/browser-function";
import { useCartTotal } from "@/store/useCartStore";
import React, { useEffect } from "react";
import consola from "consola";

export default function PayLaterMessageLive() {
    const { ready, loading, error } = usePayPalWebSdk();
    const total = useCartTotal();

    useEffect(() => {
        let cancelled = false;

        if (!ready) return;

        (async () => {
            try {
                const clientToken = await getBrowserSafeClientToken();
                if (cancelled) return;

                const paypal = (window as any).paypal;
                consola.log("PayPal SDK ready (live):", paypal, "clientToken:", clientToken);

                const sdkInstance = await paypal?.createInstance?.({
                    clientToken,
                    components: ["paypal-messages"],
                    pageType: "checkout",
                });

                sdkInstance.createPayPalMessages();

                if (cancelled) {
                    if (sdkInstance?.destroy) sdkInstance.destroy();
                    return;
                }
            } catch (e) {
                if (!cancelled) consola.error("PayPal init error (live):", e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [ready]);

    if (loading) return <div>正在加载 PayPal SDK (Live)…</div>;
    if (error) return <div>PayPal SDK加载失败: {error.message}</div>;

    return (
        <div className="w-full min-h-[60px] flex items-center justify-center">
            <paypal-message
                id="paypal-message-live"
                auto-bootstrap
                amount={String(total)}
                currency-code="USD"
                text-color="MONOCHROME"
                logo-position="TOP"
            ></paypal-message>
        </div>
    );
}
