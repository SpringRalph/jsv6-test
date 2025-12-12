// @ts-nocheck
import { useCartStore } from "@/store/useCartStore";
import { createOrderGooglePay, captureOrder } from "@/services/paypal-sdk-function/browser-function"

function getTotalAmount() {
    const cartState = useCartStore.getState();
    return (cartState.product.price * cartState.quantity).toFixed(2);
}

export async function setupGooglePayButton(sdkInstance) {
    // Create Google Pay session
    const googlePaySession = sdkInstance.createGooglePayOneTimePaymentSession();

    const purchaseAmount = getTotalAmount();

    try {
        // Initialize Google Pay client
        const paymentsClient = new google.payments.api.PaymentsClient({
            environment: "TEST", // Use "PRODUCTION" for live transactions
            paymentDataCallbacks: {
                onPaymentAuthorized: (paymentData) =>
                    onPaymentAuthorized(purchaseAmount, paymentData, googlePaySession),
            },
        });

        // Get Google Pay configuration from PayPal
        const googlePayConfig = await googlePaySession.getGooglePayConfig();

        console.log("Google Pay Config:", googlePayConfig);

        // Check if Google Pay is available
        const isReadyToPay = await paymentsClient.isReadyToPay({
            allowedPaymentMethods: googlePayConfig.allowedPaymentMethods,
            apiVersion: googlePayConfig.apiVersion,
            apiVersionMinor: googlePayConfig.apiVersionMinor,
        });

        if (isReadyToPay.result) {
            // Create and append Google Pay button
            const button = paymentsClient.createButton({
                onClick: () =>
                    onGooglePayButtonClick(
                        purchaseAmount,
                        paymentsClient,
                        googlePayConfig,
                    ),
            });

            document.getElementById("googlepay-button-container")!.appendChild(button);
        }
    } catch (error) {
        console.error("Setup error:", error);
    }
}

async function onGooglePayButtonClick(
    purchaseAmount,
    paymentsClient,
    googlePayConfig,
) {
    try {
        const paymentDataRequest = await getGooglePaymentDataRequest(
            purchaseAmount,
            googlePayConfig,
        );

        paymentsClient.loadPaymentData(paymentDataRequest);
    } catch (error) {
        console.error(error);
    }
}


async function getGooglePaymentDataRequest(purchaseAmount, googlePayConfig) {
    const {
        allowedPaymentMethods,
        merchantInfo,
        apiVersion,
        apiVersionMinor,
        countryCode,
    } = googlePayConfig;

    const baseRequest = {
        apiVersion,
        apiVersionMinor,
    };

    const paymentDataRequest = Object.assign({}, baseRequest);
    paymentDataRequest.allowedPaymentMethods = allowedPaymentMethods;
    paymentDataRequest.transactionInfo = getGoogleTransactionInfo(
        purchaseAmount,
        countryCode,
    );
    paymentDataRequest.merchantInfo = merchantInfo;
    paymentDataRequest.callbackIntents = ["PAYMENT_AUTHORIZATION"];

    return paymentDataRequest;
}


function getGoogleTransactionInfo(purchaseAmount, countryCode) {
    const totalAmount = parseFloat(purchaseAmount);
    const subtotal = (totalAmount * 0.9).toFixed(2);
    const tax = (totalAmount * 0.1).toFixed(2);

    return {
        displayItems: [
            {
                label: "Subtotal",
                type: "SUBTOTAL",
                price: subtotal,
            },
            {
                label: "Tax",
                type: "TAX",
                price: tax,
            },
        ],
        countryCode: countryCode,
        currencyCode: "USD",
        totalPriceStatus: "FINAL",
        totalPrice: purchaseAmount,
        totalPriceLabel: "Total",
    };
}


async function onPaymentAuthorized(
    purchaseAmount,
    paymentData,
    googlePaySession,
) {
    try {


        const { orderId } = await createOrderGooglePay();
        // debugger;

        // Confirm order with Google Pay payment data
        const { status } = await googlePaySession.confirmOrder({
            orderId,
            paymentMethodData: paymentData.paymentMethodData,
        });

        if (status !== "PAYER_ACTION_REQUIRED") {
            // Capture the order
            const orderData = await captureOrder({ orderId });
            console.log(JSON.stringify(orderData, null, 2));
        }

        return { transactionState: "SUCCESS" };
    } catch (err) {
        console.error("Payment authorization error:", err);
        return {
            transactionState: "ERROR",
            error: {
                message: err.message,
            },
        };
    }
}