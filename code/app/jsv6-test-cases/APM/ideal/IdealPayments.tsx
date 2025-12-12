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

import React, { useEffect } from "react";
import toast from "react-hot-toast";

export default function IdealPayments() {
    const { ready, loading, error } = usePayPalWebSdk();

    function setupPaymentFields(idealCheckout: any) {
        // Create payment field for full name with optional prefill
        const fullNameField = idealCheckout.createPaymentFields({
            type: "name",
            value: "Test ideal", // Optional prefill value
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
            .querySelector("#ideal-full-name")!
            .appendChild(fullNameField);
    }

    // Setup standard iDeal button
    async function setupIdealButtonHandler(idealSession: any) {
        const idealButton = document.querySelector("#ideal-button")!;
        idealButton.removeAttribute("hidden");

      
        idealButton.addEventListener("click", async () => {
            try {
                console.log("Validating payment fields...");

                // Validate the payment fields
                const isValid = await idealSession.validate();

                if (isValid) {
                    console.log(
                        "Validation successful, starting payment flow..."
                    );

                    // get the promise reference by invoking createOrder()
                    // do not await this async function since it can cause transient activation issues
                    const createOrderPromise = createEUROrder();

                    // Start payment flow with popup mode
                    await idealSession.start(
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
                    testBuyerCountry: "NL", // Netherlands  for iDeal testing
                    components: ["ideal-payments"],
                    pageType: "checkout",
                });

                const idealSession =
                    //@ts-ignore
                    sdkInstance.createIdealOneTimePaymentSession(
                        paymentSessionOptions
                    );

                if (!true) {
                    // ####################### 进行eligibility check ###############################

                    // Check if ideal is eligible
                    const paymentMethods =
                        await sdkInstance.findEligibleMethods({
                            currencyCode: "EUR",
                        });

                    if (paymentMethods.isEligible("ideal")) {
                        // Setup payment fields
                        setupPaymentFields(idealSession);
                        setupIdealButtonHandler(idealSession);
                    }

                    // ############################################################################
                } else {
                    // Setup payment fields
                    setupPaymentFields(idealSession);
                    setupIdealButtonHandler(idealSession);
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
        
            <div id="ideal-full-name" className=" h-[60] w-full"></div>
            <ideal-button
                id="ideal-button"
                className=" w-[95%] "
                hidden
            ></ideal-button>
        </div>
    );
}
