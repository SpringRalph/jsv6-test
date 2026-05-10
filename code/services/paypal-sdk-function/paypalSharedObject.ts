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

export type AppSdkInstance = SdkInstance<["paypal-payments", "venmo-payments"]>;