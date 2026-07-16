"use client";

import { useEnvStore } from "@/store/useEnvStore";
import { buildAuthAssertionHeader } from "@/services/paypal-sdk-function/auth-assertion";

/** Returns x-paypal-* headers based on the current store env/credentials. */
export function getPayPalHeaders(): Record<string, string> {
    const store = useEnvStore.getState();
    const headers: Record<string, string> = {
        "x-paypal-client-id": store.activeClientId(),
        "x-paypal-secret": store.activeSecret(),
        "x-paypal-env": store.env,
    };

    if (store.integrationMode === "partner") {
        const merchantId = store.activeAuthAssertionMerchantId();
        if (merchantId) {
            headers["x-paypal-auth-assertion"] = buildAuthAssertionHeader(store.activeClientId(), merchantId);
        }
    }

    return headers;
}
