"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import {
    createOrderForSavedPaymentMethods,
    captureOrder,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import { AppSdkInstance } from "@/services/paypal-sdk-function/paypalSharedObject";
import { safeFindEligibleMethods } from "@/services/paypal-sdk-function/safe-find-eligible-methods";
import { getPayPalHeaders } from "@/services/paypal-sdk-function/paypal-headers";
import { useCartTotal } from "@/store/useCartStore";

import React, { useEffect, useState, useRef } from "react";
import consola from "consola";
import toast from "react-hot-toast";
import { EligibilityOverlay } from "@/components/ui/EligibilityOverlay";

// Vault- and customer-scoped client token, matching the official SDK
// sample's getBrowserSafeClientToken({ targetCustomerId, vaultId }).
async function fetchScopedClientToken(vaultId: string, targetCustomerId: string): Promise<string> {
    const params = new URLSearchParams();
    if (vaultId) params.append("vaultId", vaultId);
    if (targetCustomerId) params.append("targetCustomerId", targetCustomerId);

    const url = `/api/paypal/client-token${params.toString() ? "?" + params.toString() : ""}`;
    const res = await fetch(url, { headers: getPayPalHeaders() });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch scoped client token: ${text}`);
    }
    const json = await res.json();
    if (!json?.clientToken) throw new Error("No clientToken in response");
    return json.clientToken;
}

// Test scenario dedicated to the <paypal-saved-payment-methods> web
// component in isolation (no paypal-payments buttons component), mirroring
// v6-web-sdk-sample-integration's savedPaymentMethods/html sample:
// - "Set" (re)initializes the SDK for the entered vaultId/targetCustomerId.
// - Clicking the saved-payment-method component opens the buyer-approval
//   popup for an order created WITHOUT a vault ID (payment_source.paypal
//   with a vault ID would charge instantly and can't be approved via popup).
// - "Submit Order" captures the popup-approved order if one exists,
//   otherwise creates + (if needed) captures an instant order using the
//   configured vault ID directly.
export default function ButtonSavedPaymentMethods() {
    const { ready, loading, error } = usePayPalWebSdk();
    const [isInitializing, setIsInitializing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [vaultId, setVaultId] = useState("");
    const [targetCustomerId, setTargetCustomerId] = useState("");
    const [approvedOrderId, setApprovedOrderId] = useState<string | null>(null);
    const [spmEligible, setSpmEligible] = useState(false);
    const total = useCartTotal();

    const sdkInstanceRef = useRef<AppSdkInstance | null>(null);
    const editSessionRef = useRef<any>(null);
    const spmElRef = useRef<HTMLElement | null>(null);

    // Prefill from the currently-active vault on mount so the scenario is
    // usable without manually copying a vault ID.
    useEffect(() => {
        if (!ready) return;
        (async () => {
            try {
                const res = await fetch("/api/vault/active");
                if (res.ok) {
                    const { method } = await res.json();
                    if (method) {
                        setVaultId(method.vault_id || "");
                        setTargetCustomerId(method.customer_id || "");
                    }
                }
            } catch {
                // no active vault — user enters manually
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready]);

    // Re-initialize whenever the buyer clicks "Set" — changing the vault
    // configuration invalidates any order approved under the previous one.
    async function initializePayPal() {
        setApprovedOrderId(null);
        setSpmEligible(false);

        try {
            setIsInitializing(true);

            const clientToken = await fetchScopedClientToken(vaultId.trim(), targetCustomerId.trim());

            const paypal = (window as any).paypal;
            const sdkInstance = await paypal.createInstance({
                clientToken,
                components: ["paypal-saved-payment-methods", "paypal-messages"],
            });
            sdkInstanceRef.current = sdkInstance;

            const paymentMethods = await safeFindEligibleMethods(sdkInstance, {
                currencyCode: "USD",
            });
            if (!paymentMethods) return;

            const { canBeVaulted } = paymentMethods.getDetails("paypal");

            if (paymentMethods.isEligible("paypal") && canBeVaulted) {
                configureSavedPaymentMethodsComponent(sdkInstance);
                sdkInstance.createPayPalMessages({
                    buyerCountry: "US",
                    currencyCode: "USD",
                });
                setSpmEligible(true);
                toast.success("SDK initialized — saved payment method loaded");
            } else {
                toast.error("paypal is not eligible / vaultable for this client token");
            }
        } catch (e: any) {
            consola.error("initializePayPal failed:", e);
            toast.error(`Init failed: ${e.message}`);
        } finally {
            setIsInitializing(false);
        }
    }

    function configureSavedPaymentMethodsComponent(sdkInstance: AppSdkInstance) {
        const el = spmElRef.current;
        if (!el) return;

        const session = (sdkInstance as any).createPayPalEditSavedPaymentSession({
            commit: false,
            onApprove: (data: any) => {
                const oid = data.orderId || data.orderID;
                consola.log("[SPM onApprove]", data);
                if (!oid) {
                    consola.warn("[SPM onApprove] no order id in payload");
                    return;
                }
                setApprovedOrderId(oid);
                toast.success(
                    `Payment method approved for order ${oid} — click "Submit Order" to capture it.`,
                );
            },
            onCancel: (data: any) => {
                consola.log("[SPM onCancel]", data);
                toast("onCancel() callback called", { icon: "⚠️" });
            },
            onError: (err: any) => {
                consola.error("[SPM onError]", err);
                toast.error(`onError() callback called: ${err?.message ?? err}`);
            },
        });
        // The session is reassigned on every "Set" click; the click handler
        // below (attached once) always reads the latest one through the ref.
        editSessionRef.current = session;

        el.removeAttribute("hidden");

        if (el.dataset.listenerAttached) return;
        el.dataset.listenerAttached = "true";

        el.addEventListener("click", async () => {
            try {
                // Get the promise reference by invoking createOrder() without
                // awaiting it first — awaiting here can lose the popup's
                // transient user-activation. The order must NOT carry the
                // vault ID: doing so would charge it immediately (COMPLETED),
                // which the buyer-approval popup can't work with.
                const createOrderPromise = createOrderForSavedPaymentMethods();
                await editSessionRef.current.start(
                    { presentationMode: "auto" },
                    createOrderPromise,
                );
            } catch (err) {
                consola.error("SPM session start error:", err);
                handlePaymentError(err);
            }
        });
    }

    async function onSubmitOrder() {
        if (!approvedOrderId && !vaultId.trim()) {
            toast.error(
                "No order to submit — set a vault ID, or click the saved payment method to approve an order first.",
            );
            return;
        }

        setIsSubmitting(true);
        try {
            let orderId = approvedOrderId;
            let captureData: any = null;

            if (!orderId) {
                // Creating an order with a vault ID charges the saved payment
                // method in the same call, so it can come back COMPLETED
                // with nothing left to capture.
                const createResult = await createOrderForSavedPaymentMethods(vaultId.trim());
                orderId = createResult.orderId;
                if (createResult.status === "COMPLETED") {
                    captureData = createResult.responseBody;
                }
            }

            if (!captureData) {
                captureData = await captureOrder({ orderId: orderId! });
            }

            setApprovedOrderId(null);
            toast.success(`Order ${captureData?.id ?? orderId} captured!`);
        } catch (e: any) {
            consola.error("Order submit failed:", e);
            toast.error(`Order submit failed: ${e.message}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    useEffect(() => {
        if (!ready) return;
        if (vaultId.trim()) {
            initializePayPal();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, vaultId]);

    if (loading) return <div>Loading PayPal SDK…</div>;
    if (error) return <div>PayPal SDK load failed: {error.message}</div>;

    return (
        <div className="relative w-full space-y-4">
            <EligibilityOverlay
                isVisible={isInitializing}
                message="Initializing paypal-saved-payment-methods…"
            />

            {/* Vault configuration */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Vault ID</label>
                <input
                    type="text"
                    value={vaultId}
                    onChange={(e) => setVaultId(e.target.value)}
                    placeholder="Enter vault ID"
                    className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                />
                <label className="text-sm font-medium">Target Customer ID</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={targetCustomerId}
                        onChange={(e) => setTargetCustomerId(e.target.value)}
                        placeholder="Enter target customer ID (optional)"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
                    />
                    <button
                        id="set-vault-config"
                        onClick={initializePayPal}
                        disabled={isInitializing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        Set
                    </button>
                </div>
            </div>

            {/* paypal-saved-payment-methods component under test, laid out
                the same way as the official sample: logo + label + the
                component itself (hidden until eligible), credit message
                below aligned under the "PayPal" label. */}
            <div className="flex flex-row flex-wrap items-center gap-3">
                <img
                    src="https://www.paypalobjects.com/js-sdk-logos/2.3.2/paypal-mark.svg"
                    alt="PayPal"
                    width={45}
                    className="block"
                />
                <span className="font-bold">PayPal</span>
                <paypal-saved-payment-methods
                    ref={(el: HTMLElement | null) => {
                        spmElRef.current = el;
                    }}
                    id="saved-payment-method"
                    hidden
                ></paypal-saved-payment-methods>
                {!spmEligible && (
                    <span className="text-sm text-muted-foreground">
                        Click &quot;Set&quot; with a vault ID to load the saved payment method
                    </span>
                )}
                <paypal-message
                    id="paypal-message"
                    auto-bootstrap
                    amount={String(total)}
                    currency-code="USD"
                    className="basis-full ml-[calc(45px+0.75rem)]"
                ></paypal-message>
            </div>

            {/* Submit Order — captures the popup-approved order, or falls
                back to an instant vault-id charge if none was approved. */}
            <button
                id="submit-button"
                onClick={onSubmitOrder}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
                {isSubmitting ? "Submitting…" : "Submit Order"}
            </button>
        </div>
    );
}
