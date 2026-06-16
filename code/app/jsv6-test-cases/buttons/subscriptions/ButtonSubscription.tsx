"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { useSdkInitOptions } from "@/hooks/useSdkInitOptions";
import { handlePaymentCancellation, handlePaymentError } from "@/services/paypal-sdk-function/browser-function";
import { getPayPalHeaders } from "@/services/paypal-sdk-function/paypal-headers";
import { safeFindEligibleMethods } from "@/services/paypal-sdk-function/safe-find-eligible-methods";
import React, { useEffect, useRef, useState } from "react";
import consola from "consola";
import toast from "react-hot-toast";

async function createSubscription(planId: string): Promise<{ subscriptionId: string }> {
    const res = await fetch("/api/paypal/subscription/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...getPayPalHeaders(),
        },
        body: JSON.stringify(planId ? { planId } : {}),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(`Subscription creation failed: ${JSON.stringify(data)}`);
    }

    toast(`Subscription created: ${data.id}`, { icon: "ℹ️", duration: 4000 });
    consola.info("Subscription created:", data.id);
    return { subscriptionId: data.id };
}

interface ButtonSubscriptionProps {
    defaultPlanId?: string;
}

export default function ButtonSubscription({ defaultPlanId = "" }: ButtonSubscriptionProps) {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();
    const setupDoneRef = useRef(false);
    const [planId, setPlanId] = useState(defaultPlanId);
    const planIdRef = useRef(planId);

    useEffect(() => {
        planIdRef.current = planId;
    }, [planId]);

    async function setupSubscriptionButton(sdkInstance: any) {
        const subscriptionSession = sdkInstance.createPayPalSubscriptionPaymentSession({
            async onApprove(data: any) {
                consola.log("Subscription approved:", JSON.stringify(data, null, "  "));
                toast.success(`Subscription approved! ID: ${data.subscriptionId ?? JSON.stringify(data)}`, { duration: 5000 });
            },
            onCancel(data: any) {
                consola.log("Subscription cancelled:", data);
                handlePaymentCancellation();
            },
            onError(err: any) {
                consola.error("Subscription error:", err);
                handlePaymentError(err);
            },
        });

        const paypalButton = document.querySelector("#subscription-btn")!;
        paypalButton.removeAttribute("hidden");

        paypalButton.addEventListener("click", async () => {
            try {
                // do not await — must not block transient activation
                // read latest planId via ref to avoid stale closure
                const createSubscriptionPromise = createSubscription(planIdRef.current);
                await subscriptionSession.start(
                    { presentationMode: "auto" },
                    createSubscriptionPromise
                );
            } catch (err) {
                consola.error("Subscription button click error:", err);
                handlePaymentError(err);
            }
        });
    }

    useEffect(() => {
        let cancelled = false;

        if (!ready) return;
        if (setupDoneRef.current) return;

        (async () => {
            try {
                const initOptions = await getInitOptions();
                if (cancelled) return;

                const paypal = (window as any).paypal;
                consola.log("PayPal SDK ready, initOptions:", initOptions);

                const sdkInstance = await paypal?.createInstance?.({
                    ...initOptions,
                    components: ["paypal-subscriptions"],
                    pageType: "checkout",
                });

                if (cancelled) {
                    sdkInstance?.destroy?.();
                    return;
                }

                const paymentMethods = await safeFindEligibleMethods(sdkInstance, {
                    paymentFlow: "RECURRING_PAYMENT",
                    currencyCode: "USD",
                });
                if (!paymentMethods) return;

                if (paymentMethods.isEligible("paypal")) {
                    await setupSubscriptionButton(sdkInstance);
                    setupDoneRef.current = true;
                } else {
                    consola.warn("PayPal not eligible for recurring payment");
                }
            } catch (e) {
                if (!cancelled) consola.error("Subscription SDK init error:", e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [ready]);

    if (loading) return <div>正在加载 PayPal SDK…</div>;
    if (error) return <div>PayPal SDK加载失败: {error.message}</div>;

    return (
        <div className="w-full space-y-4">
            <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                    Plan ID <span className="text-xs">(留空则自动创建)</span>
                </label>
                <input
                    type="text"
                    value={planId}
                    onChange={(e) => setPlanId(e.target.value)}
                    placeholder="P-XXXXXXXXXXXXXXXXXXXXXXXX"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono placeholder:text-muted-foreground/50"
                />
            </div>
            <div className="flex items-center justify-center min-h-[60px]">
                <paypal-button id="subscription-btn" type="subscribe" hidden></paypal-button>
            </div>
        </div>
    );
}
