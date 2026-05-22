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
import {
    useButtonStyleStore,
    BORDER_RADIUS_MAP,
} from "@/store/useButtonStyleStore";
import React, { useEffect, useRef, useState, useCallback } from "react";
import consola from "consola";
import StyleControlPanel from "./StyleControlPanel";

export default function ButtonStyling() {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();
    const [isButtonReady, setIsButtonReady] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const btnRef = useRef<HTMLElement | null>(null);

    const { color, type, borderRadiusPreset, width, height } =
        useButtonStyleStore();

    // Applies current store values to the <paypal-button> DOM element
    const applyStyles = useCallback(() => {
        const el = btnRef.current;
        if (!el) return;

        el.className = `paypal-button-styled ${color}`;
        el.setAttribute("type", type);
        (el as HTMLElement).style.setProperty(
            "--paypal-button-border-radius",
            BORDER_RADIUS_MAP[borderRadiusPreset]
        );
        (el as HTMLElement).style.width = `${width}px`;
        (el as HTMLElement).style.height = `${height}px`;
    }, [color, type, borderRadiusPreset, width, height]);

    async function setupPayPalButton(sdkInstance: AppSdkInstance) {
        const paypalPaymentSession =
            sdkInstance.createPayPalOneTimePaymentSession(paymentSessionOptions);

        const el = document.querySelector<HTMLElement>("#paypal-btn");
        if (!el) return;
        btnRef.current = el;

        el.removeAttribute("hidden");
        applyStyles();
        setIsButtonReady(true);

        el.addEventListener("click", async () => {
            try {
                await paypalPaymentSession.start(
                    { presentationMode: "auto" },
                    createOrder()
                );
            } catch (err) {
                consola.error("PayPal payment start error:", err);
                handlePaymentError(err);
            }
        });
    }

    useEffect(() => {
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

                if (!cancelled) await setupPayPalButton(sdkInstance);

                if (cancelled && sdkInstance?.destroy) sdkInstance.destroy();
            } catch (e) {
                if (!cancelled) consola.error("PayPal init error:", e);
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready]);

    const handleApply = useCallback(async () => {
        if (!isButtonReady || isApplying) return;
        setIsApplying(true);
        try {
            applyStyles();
        } finally {
            setIsApplying(false);
        }
    }, [isButtonReady, isApplying, applyStyles]);

    if (loading) return <div>正在加载 PayPal SDK…</div>;
    if (error) return <div>PayPal SDK加载失败: {error.message}</div>;

    return (
        <div className="w-full flex flex-col gap-6">
            {/* PayPal button preview */}
            <div className="flex items-center justify-center min-h-[80px]">
                <paypal-button
                    id="paypal-btn"
                    type="pay"
                    hidden
                    className="paypal-button-styled paypal-gold"
                />
            </div>

            {/* Style controls */}
            <StyleControlPanel
                isButtonReady={isButtonReady && !isApplying}
                onApply={handleApply}
            />
        </div>
    );
}
