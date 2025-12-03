//@ts-nocheck
import { useCartStore } from "@/store/useCartStore";
import { createOrderApplePay, captureOrder } from "@/services/paypal-sdk-function/browser-function"

function getTotalAmount() {
    const cartState = useCartStore.getState();
    return (cartState.product.price * cartState.quantity).toFixed(2);
}

export async function setupApplePayButton(sdkInstance) {
    const paypalSdkApplePayPaymentSession =
        await sdkInstance.createApplePayOneTimePaymentSession();

    const config = await paypalSdkApplePayPaymentSession.config();

    // Create Apple Pay button
    document.getElementById("applepay-button-container").innerHTML =
        '<apple-pay-button id="apple-pay-button" buttonstyle="black" type="buy" locale="en">';

    console.log("Apple Pay Button Created!")

    // Pass config parameters to the click handler
    document.getElementById("apple-pay-button")
        .addEventListener("click", () => handleApplePayClick(config, paypalSdkApplePayPaymentSession));
}

async function handleApplePayClick(config, paypalSdkApplePayPaymentSession) {
    const paymentRequest = {
        countryCode: "US",
        currencyCode: "USD",
        merchantCapabilities: config.merchantCapabilities,
        supportedNetworks: config.supportedNetworks,
        requiredBillingContactFields: ["name", "phone", "email", "postalAddress"],
        requiredShippingContactFields: [],
        total: {
            label: "Your Store Name",
            amount: getTotalAmount(),
            type: "final",
        },
    };

    const applePaySession = new ApplePaySession(4, paymentRequest);

    // Configure event handlers
    setupApplePayEventHandlers(applePaySession, paypalSdkApplePayPaymentSession);

    applePaySession.begin();
}

function setupApplePayEventHandlers(applePaySession, paypalSession) {
    // Merchant validation
    applePaySession.onvalidatemerchant = (event) => {
        paypalSession.validateMerchant({
            validationUrl: event.validationURL,
        }).then((payload) => {
            applePaySession.completeMerchantValidation(payload.merchantSession);
        }).catch((err) => {
            console.error("Merchant validation failed:", err);
            applePaySession.abort();
        });
    };

    // Payment method selection
    applePaySession.onpaymentmethodselected = () => {
        applePaySession.completePaymentMethodSelection({
            newTotal: paymentRequest.total,
        });
    };

    // Payment authorization
    applePaySession.onpaymentauthorized = async (event) => {
        try {
            // Create PayPal order
             const { orderId } = await createOrderApplePay();

            // Confirm order with Apple Pay token
            await paypalSession.confirmOrder({
                orderId,
                token: event.payment.token,
                billingContact: event.payment.billingContact,
                shippingContact: event.payment.shippingContact,
            });

            // Capture payment
            const result = await captureOrder({ orderId });

            applePaySession.completePayment({
                status: window.ApplePaySession.STATUS_SUCCESS,
            });

            console.log("Payment successful:", result);
        } catch (error) {
            console.error("Payment failed:", error);
            applePaySession.completePayment({
                status: window.ApplePaySession.STATUS_FAILURE,
            });
        }
    };

    // Payment cancellation
    applePaySession.oncancel = () => {
        console.log("Apple Pay cancelled");
    };
}