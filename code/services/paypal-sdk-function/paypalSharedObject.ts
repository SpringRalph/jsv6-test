import { OnApproveDataOneTimePayments, PayPalOneTimePaymentSessionOptions, SdkInstance } from "@paypal/paypal-js/sdk-v6";
import consola from "consola";
import { captureOrder, handlePaymentCancellation, handlePaymentError, handlePaymentSuccess } from "./browser-function";

export const paymentSessionOptions: PayPalOneTimePaymentSessionOptions = {
    // Called when user approves a payment
    async onApprove(data: OnApproveDataOneTimePayments) {
        consola.log("Payment approved:\r\n", JSON.stringify(data, null, "  "));

        try {
            //@ts-ignore
            const orderId = data.orderId ?? data.data.orderId

            const orderData = await captureOrder({
                orderId: orderId,
            });
            consola.log("Payment captured successfully:", orderData);
            handlePaymentSuccess(orderData);
        } catch (error) {
            consola.error("Payment capture failed:", error);
            handlePaymentError(error);
        }
    },

    // Called when user cancels a payment
    onCancel() {
        consola.log("Payment cancelled:");
        handlePaymentCancellation();
    },

    // Called when an error occurs during payment
    onError(error: any) {
        consola.error("Payment error:", error);
        handlePaymentError(error);
    },
};


export const enhancedPaymentSessionOptions = (fn: Function, arg?: any): PayPalOneTimePaymentSessionOptions => {
    const sessionObj = {
        // Called when user approves a payment
        async onApprove(data: OnApproveDataOneTimePayments) {
            consola.log("Payment approved:\r\n", JSON.stringify(data, null, "  "));

            try {
                //@ts-ignore
                const orderId = data.orderId ?? data.data.orderId

                const orderData = await captureOrder({
                    orderId: orderId,
                });
                consola.log("Payment captured successfully:", orderData);
                handlePaymentSuccess(orderData);

                fn(data, orderData, arg);
            } catch (error) {
                consola.error("Payment capture failed:", error);
                handlePaymentError(error);
            }
        },

        // Called when user cancels a payment
        onCancel() {
            consola.log("Payment cancelled:");
            handlePaymentCancellation();
        },

        // Called when an error occurs during payment
        onError(error: any) {
            consola.error("Payment error:", error);
            handlePaymentError(error);
        },
    }

    return sessionObj

};


export const findEligibleMethodsPayload = {
    customer: {
        // leverage your own service to derive the customer's country code from their IP Address,
        // or retrieve it from the user's profile if they are already authenticated.
        country_code: "US",
    },
    preferences: {
        payment_flow: "ONE_TIME_PAYMENT",
        payment_source_constraint: {
            constraint_type: "INCLUDE",
            payment_sources: [
                "PAYPAL",
                "PAYPAL_PAY_LATER",
                "PAYPAL_CREDIT",
                "VENMO",
                "ADVANCED_CARDS",
            ],
        },
    },
    purchase_units: [{ amount: { currency_code: "USD" } }],
}

export type AppSdkInstance = SdkInstance<["paypal-payments", "venmo-payments"]>;