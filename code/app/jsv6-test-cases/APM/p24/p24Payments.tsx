"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { useSdkInitOptions } from "@/hooks/useSdkInitOptions";
import {
    createPLNOrder,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import {
    AppSdkInstance,
    paymentSessionOptions,
} from "@/services/paypal-sdk-function/paypalSharedObject";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import consola from "consola";
import { EligibilityOverlay } from "@/components/ui/EligibilityOverlay";

export default function p24Payments() {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();
    const [isInitializing, setIsInitializing] = useState(false);

    function setupPaymentFields(p24Checkout: any) {
        // Create payment field for full name with optional prefill
        const fullNameField = p24Checkout.createPaymentFields({
            type: "name",
            value: "Test p24", // Optional prefill value
            style: {
                // Optional styling to match your website
                variables: {
                    textColor: "#333333",
                    colorTextPlaceholder: "#999999",
                    fontFamily: "Verdana, sans-serif",
                    fontSizeBase: "14px",
                },
            },
        });

        // Create payment field for email with optional prefill
        const emailField = p24Checkout.createPaymentFields({
            type: "email",
            value: "my.test@test.com", // Optional prefill value
            style: {
                // Optional styling to match your website
                variables: {
                    textColor: "#333333",
                    colorTextPlaceholder: "#999999",
                    fontFamily: "Verdana, sans-serif",
                    fontSizeBase: "14px",
                },
            },
        });

        // Mount the field to the container
        document.querySelector("#p24-full-name")!.appendChild(fullNameField);
        document.querySelector("#p24-email")!.appendChild(emailField);
    }

    // Setup standard p24 button
    async function setupP24ButtonHandler(p24Session: any) {
        const p24Button = document.querySelector("#p24-button")!;
        p24Button.removeAttribute("hidden");

        p24Button.addEventListener("click", async () => {
            try {
                consola.log("Validating payment fields...");

                // Validate the payment fields
                const isValid = await p24Session.validate();

                if (isValid) {
                    consola.log(
                        "Validation successful, starting payment flow..."
                    );

                    // get the promise reference by invoking createOrder()
                    // do not await this async function since it can cause transient activation issues
                    const createOrderPromise = createPLNOrder();

                    // Start payment flow with popup mode
                    await p24Session.start(
                        { presentationMode: "popup" },
                        createOrderPromise
                    );
                } else {
                    consola.error("Validation failed");
                    toast.error(
                        "Please fill in all required fields correctly."
                    );
                }
            } catch (error) {
                consola.error("PayPal payment start error:", error);
                handlePaymentError(error);
            }
        });
    }

    useEffect(() => {
        //cancelled 变量用于在组件卸载或 effect 被重新触发时中止异步流程，避免在已卸载的组件上做状态更新或继续创建/使用资源
        let cancelled = false;

        if (!ready) return;

        setIsInitializing(true);

        (async () => {
            try {
                const initOptions = await getInitOptions();
                if (cancelled) return;

                const paypal = (window as any).paypal;
                consola.log(
                    "PayPal SDK ready:",
                    paypal,
                    "initOptions:",
                    initOptions
                );

                const sdkInstance = await paypal?.createInstance?.({
                    ...initOptions,
                    testBuyerCountry: "PL", // Poland for p24 testing
                    components: ["p24-payments"],
                    pageType: "checkout",
                });

                const paymentMethods = await sdkInstance.findEligibleMethods({
                    currencyCode: "PLN",
                });

                if (paymentMethods.isEligible("p24")) {
                    const p24Session =
                        //@ts-ignore
                        sdkInstance.createP24OneTimePaymentSession(
                            paymentSessionOptions
                        );
                    setupPaymentFields(p24Session);
                    setupP24ButtonHandler(p24Session);
                }

                if (cancelled) {
                    if (sdkInstance?.destroy) sdkInstance.destroy();
                    return;
                }
            } catch (e) {
                if (!cancelled) consola.error("PayPal init error:", e);
            } finally {
                if (!cancelled) setIsInitializing(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [ready]);

    if (loading) return <div>正在加载 PayPal SDK…</div>;
    if (error) return <div>PayPal SDK加载失败: {error.message}</div>;

    return (
        <div className="relative w-full flex items-center justify-center flex-col">
            <EligibilityOverlay isVisible={isInitializing} message="Checking P24 Eligibility…" />
            <div id="p24-full-name" className=" h-[60] w-full"></div>
            <div id="p24-email" className=" h-[60] w-full"></div>
            <p24-button
                id="p24-button"
                className=" w-[95%] "
                hidden
            ></p24-button>
        </div>
    );
}
