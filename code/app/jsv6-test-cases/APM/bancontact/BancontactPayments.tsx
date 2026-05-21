"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import {
    createEUROrder,
    getBrowserSafeClientToken,
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

export default function BancontactPayments() {
    const { ready, loading, error } = usePayPalWebSdk();
    const [isInitializing, setIsInitializing] = useState(false);

    function setupPaymentFields(bancontactCheckout: any) {
        // Create payment field for full name with optional prefill
        const fullNameField = bancontactCheckout.createPaymentFields({
            type: "name",
            value: "Test Bancontact", // Optional prefill value
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
        document
            .querySelector("#bancontact-full-name")!
            .appendChild(fullNameField);
    }

    // Setup standard bancontact button
    async function setupBancontactButtonHandler(bancontactSession: any) {
        const bancontactButton = document.querySelector("#bancontact-button")!;
        bancontactButton.removeAttribute("hidden");

      
        bancontactButton.addEventListener("click", async () => {
            try {
                consola.log("Validating payment fields...");

                // Validate the payment fields
                const isValid = await bancontactSession.validate();

                if (isValid) {
                    consola.log(
                        "Validation successful, starting payment flow..."
                    );

                    // get the promise reference by invoking createOrder()
                    // do not await this async function since it can cause transient activation issues
                    const createOrderPromise = createEUROrder();

                    // Start payment flow with popup mode
                    await bancontactSession.start(
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
                const clientToken = await getBrowserSafeClientToken();
                if (cancelled) return;

                const paypal = (window as any).paypal;
                consola.log(
                    "PayPal SDK ready:",
                    paypal,
                    "clientToken:",
                    clientToken
                );

                const sdkInstance = await paypal?.createInstance?.({
                    clientToken,
                    testBuyerCountry: "BE", // Belgium for Bancontact testing
                    components: ["bancontact-payments"],
                    pageType: "checkout",
                });

                const paymentMethods = await sdkInstance.findEligibleMethods({
                    currencyCode: "EUR",
                });

                if (paymentMethods.isEligible("bancontact")) {
                    const bancontactSession =
                        //@ts-ignore
                        sdkInstance.createBancontactOneTimePaymentSession(
                            paymentSessionOptions
                        );
                    setupPaymentFields(bancontactSession);
                    setupBancontactButtonHandler(bancontactSession);
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
            <EligibilityOverlay isVisible={isInitializing} message="Checking Bancontact Eligibility…" />
            <div id="bancontact-full-name" className=" h-[60] w-full"></div>
            <bancontact-button
                id="bancontact-button"
                className=" w-[95%] "
                hidden
            ></bancontact-button>
        </div>
    );
}
