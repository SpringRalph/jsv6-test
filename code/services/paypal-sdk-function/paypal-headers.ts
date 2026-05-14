"use client";

import { useEnvStore } from "@/store/useEnvStore";

/** Returns x-paypal-* headers based on the current store env/credentials. */
export function getPayPalHeaders(): Record<string, string> {
    const store = useEnvStore.getState();
    return {
        "x-paypal-client-id": store.activeClientId(),
        "x-paypal-secret": store.activeSecret(),
        "x-paypal-env": store.env,
    };
}
