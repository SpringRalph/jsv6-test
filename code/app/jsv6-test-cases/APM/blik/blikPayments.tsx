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

export default function blikPayments() {
    const { ready, loading, error } = usePayPalWebSdk();
    const { getInitOptions } = useSdkInitOptions();
    const [isInitializing, setIsInitializing] = useState(false);

    function setupPaymentFields(blikCheckout: any) {
        // Create payment field for full name with optional prefill
        const fullNameField = blikCheckout.createPaymentFields({
            type: "name",
            value: "Test blik", // Optional prefill value
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
        const emailField = blikCheckout.createPaymentFields({
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
        document.querySelector("#blik-full-name")!.appendChild(fullNameField);
        document.querySelector("#blik-email")!.appendChild(emailField);
    }

    // Setup standard blik button
    async function setupBlikButtonHandler(blikSession: any) {
        const blikButton = document.querySelector("#blik-button")!;
        blikButton.removeAttribute("hidden");

        blikButton.addEventListener("click", async () => {
            try {
                consola.log("Validating payment fields...");

                // Validate the payment fields
                const isValid = await blikSession.validate();

                if (isValid) {
                    consola.log(
                        "Validation successful, starting payment flow..."
                    );

                    // get the promise reference by invoking createOrder()
                    // do not await this async function since it can cause transient activation issues
                    const createOrderPromise = createPLNOrder();

                    // Start payment flow with popup mode
                    await blikSession.start(
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
                    testBuyerCountry: "PL", // Poland for blik testing
                    components: ["blik-payments"],
                    pageType: "checkout",
                });

                const paymentMethods = await sdkInstance.findEligibleMethods({
                    currencyCode: "PLN",
                });

                if (paymentMethods.isEligible("blik")) {
                    const blikSession =
                        //@ts-ignore
                        sdkInstance.createBlikOneTimePaymentSession(
                            paymentSessionOptions
                        );
                    setupPaymentFields(blikSession);
                    setupBlikButtonHandler(blikSession);
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
            <EligibilityOverlay isVisible={isInitializing} message="Checking Blik Eligibility…" />
            <div id="blik-full-name" className=" h-[60] w-full"></div>
            <div id="blik-email" className=" h-[60] w-full"></div>
            <blik-button
                id="blik-button"
                className=" w-[95%] "
                hidden
            ></blik-button>
        </div>
    );
}
