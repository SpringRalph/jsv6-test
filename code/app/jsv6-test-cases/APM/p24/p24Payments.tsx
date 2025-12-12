"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import {
    createPLNOrder,
    getBrowserSafeClientToken,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import {
    AppSdkInstance,
    paymentSessionOptions,
} from "@/services/paypal-sdk-function/paypalSharedObject";

import React, { useEffect } from "react";
import toast from "react-hot-toast";

export default function p24Payments() {
    const { ready, loading, error } = usePayPalWebSdk();

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
                console.log("Validating payment fields...");

                // Validate the payment fields
                const isValid = await p24Session.validate();

                if (isValid) {
                    console.log(
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
                    console.error("Validation failed");
                    toast.error(
                        "Please fill in all required fields correctly."
                    );
                }
            } catch (error) {
                console.error("PayPal payment start error:", error);
                handlePaymentError(error);
            }
        });
    }

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
                    testBuyerCountry: "PL", // Poland for p24 testing
                    components: ["p24-payments"],
                    pageType: "checkout",
                });

                const p24Session =
                    //@ts-ignore
                    sdkInstance.createP24OneTimePaymentSession(
                        paymentSessionOptions
                    );

                if (!true) {
                    // ####################### 进行eligibility check ###############################

                    // Check if p24 is eligible
                    const paymentMethods =
                        await sdkInstance.findEligibleMethods({
                            currencyCode: "PLN",
                        });

                    if (paymentMethods.isEligible("p24")) {
                        // Setup payment fields
                        setupPaymentFields(p24Session);
                        setupP24ButtonHandler(p24Session);
                    }

                    // ############################################################################
                } else {
                    // Setup payment fields
                    setupPaymentFields(p24Session);
                    setupP24ButtonHandler(p24Session);
                }

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

    return (
        <div className="w-full flex items-center justify-center flex-col">
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
