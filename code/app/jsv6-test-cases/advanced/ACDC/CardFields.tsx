"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import {
    captureOrder,
    createOrderACDC,
    getBrowserSafeClientToken,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import {
    AppSdkInstance,
    paymentSessionOptions,
} from "@/services/paypal-sdk-function/paypalSharedObject";

import { useEffect } from "react";

export default function CardFields() {
    const { ready, loading, error } = usePayPalWebSdk();

    // Setup card fields
    async function setupCardFields(sdkInstance: AppSdkInstance) {
        const cardSession =
            //@ts-ignore
            sdkInstance.createCardFieldsOneTimePaymentSession(
                paymentSessionOptions
            );

        const numberField = cardSession.createCardFieldsComponent({
            type: "number",
            placeholder: "Card number",
        });

        const expiryField = cardSession.createCardFieldsComponent({
            type: "expiry",
            placeholder: "MM/YY",
        });

        const cvvField = cardSession.createCardFieldsComponent({
            type: "cvv",
            placeholder: "CVV",
        });

        document
            .querySelector("#paypal-card-fields-number")!
            .appendChild(numberField);
        document
            .querySelector("#paypal-card-fields-expiry")!
            .appendChild(expiryField);
        document
            .querySelector("#paypal-card-fields-cvv")!
            .appendChild(cvvField);

        const payButton = document.querySelector("#pay-button")!;
        payButton.addEventListener("click", () => onPayClick(cardSession));
    }

    async function onPayClick(cardSession: any) {
        try {
            // get the promise reference by invoking createOrder()
            // do not await this async function since it can cause transient activation issues
            const { orderId } = await createOrderACDC();

            console.log("[ACDC Create Order]:orderId:", orderId);
            // debugger;

            const { data, state } = await cardSession.submit(orderId, {
                billingAddress: {
                    postalCode: "95131",
                }, // supply what your business needs
            });

            debugger;

            switch (state) {
                case "succeeded": {
                    const { orderId, liabilityShift } = data;
                    // 3DS may or may not have occurred; Use liabilityShift
                    // to determine if the payment should be captured

                    const capture = await captureOrder({ orderId });
                    // TODO: show success UI, redirect, etc.
                    break;
                }
                case "canceled": {
                    // Buyer dismissed 3DS modal or canceled the flow
                    // TODO: show non-blocking message & allow retry
                    break;
                }
                case "failed": {
                    // Validation or processing failure. data.message may be present
                    console.error("Card submission failed", data);
                    // TODO: surface error to buyer, allow retry
                    break;
                }
                default: {
                    // Future-proof for other states (e.g., pending)
                    console.warn("Unhandled submit state", state, data);
                }
            }
        } catch (err) {
            console.error("Payment flow error", err);
            // TODO: Show generic error and allow retry
        }
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
                    components: ["card-fields"],
                });

                if (!true) {
                    // if (true) {
                    // ####################### 进行eligibility check ###############################

                    // Check eligibility for all payment methods
                    const paymentMethods =
                        await sdkInstance.findEligibleMethods();

                    console.log(JSON.stringify(paymentMethods, null, "  "));

                    // [ATTENTION!]这里不一样了
                    if (paymentMethods.isEligible("advanced_cards")) {
                        setupCardFields(sdkInstance);
                    }

                    // ############################################################################
                } else {
                    setupCardFields(sdkInstance);
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
        <div className="w-full min-h-[60px] flex flex-col gap-1">
            <div className="card-field" id="paypal-card-fields-number"></div>
            <div className="card-field" id="paypal-card-fields-expiry"></div>
            <div className="card-field" id="paypal-card-fields-cvv"></div>
            <button id="pay-button" className="acdc-pay-button">
                Pay
            </button>
        </div>
    );
}
