import { OnApproveDataOneTimePayments, PayPalOneTimePaymentSessionOptions, SdkInstance } from "@paypal/paypal-js/sdk-v6";
import { captureOrder, handlePaymentCancellation, handlePaymentError, handlePaymentSuccess } from "./browser-function";

export const paymentSessionOptions: PayPalOneTimePaymentSessionOptions = {
    // Called when user approves a payment
    async onApprove(data: OnApproveDataOneTimePayments) {
        console.log("Payment approved:\r\n", JSON.stringify(data, null, "  "));

        try {
            //@ts-ignore
            const orderId = data.orderId ?? data.data.orderId
            
            const orderData = await captureOrder({
                orderId: orderId,
            });
            console.log("Payment captured successfully:", orderData);
            handlePaymentSuccess(orderData);
        } catch (error) {
            console.error("Payment capture failed:", error);
            handlePaymentError(error);
        }
    },

    // Called when user cancels a payment
    onCancel() {
        console.log("Payment cancelled:");
        handlePaymentCancellation();
    },

    // Called when an error occurs during payment
    onError(error: any) {
        console.error("Payment error:", error);
        handlePaymentError(error);
    },
};

export type AppSdkInstance = SdkInstance<["paypal-payments", "venmo-payments"]>;