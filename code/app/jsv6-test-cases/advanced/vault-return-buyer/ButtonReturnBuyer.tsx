"use client";

import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import { useSdkInitOptions } from "@/hooks/useSdkInitOptions";
import {
    createOrderInstant,
    createOrderEditFi,
    captureOrder,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import {
    AppSdkInstance,
} from "@/services/paypal-sdk-function/paypalSharedObject";
import { safeFindEligibleMethods } from "@/services/paypal-sdk-function/safe-find-eligible-methods";

import React, { useEffect, useState, useRef } from "react";
import consola from "consola";
import toast from "react-hot-toast";
import { EligibilityOverlay } from "@/components/ui/EligibilityOverlay";

// Inline vault-scoped token fetch (not from useSdkInitOptions because
// we need to append ?vaultId=...).
async function fetchVaultScopedClientToken(vaultId: string): Promise<string> {
    const params = new URLSearchParams();
    if (vaultId) params.append("vaultId", vaultId);

    const url = `/api/paypal/client-token${params.toString() ? "?" + params.toString() : ""}`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch vault-scoped client token: ${text}`);
    }
    const json = await res.json();
    if (!json?.clientToken) throw new Error("No clientToken in response");
    return json.clientToken;
}

export default function ButtonReturnBuyer() {
    const { ready, loading, error } = usePayPalWebSdk();
    const [isInitializing, setIsInitializing] = useState(false);

    const [vaultId, setVaultId] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [approvedOrderId, setApprovedOrderId] = useState<string | null>(null);
    const [showExecute, setShowExecute] = useState(false);

    // Holders for the mutable session / instance refs so click handlers
    // always use the latest.
    const sdkInstanceRef = useRef<AppSdkInstance | null>(null);
    const editSessionRef = useRef<any>(null);
    const fraudnetIdRef = useRef("");

    // Generate a random fraudnet session ID once per mount
    useEffect(() => {
        fraudnetIdRef.current =
            Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
    }, []);

    // Load active vault on mount
    useEffect(() => {
        if (!ready) return;
        (async () => {
            try {
                const res = await fetch("/api/vault/active");
                if (res.ok) {
                    const { method } = await res.json();
                    if (method) {
                        setVaultId(method.vault_id || "");
                        setCustomerId(method.customer_id || "");
                    }
                }
            } catch {
                // no active vault — user enters manually
            }
        })();
    }, [ready]);

    // Re-initialize SDK whenever vaultId changes (triggered by "Set" button)
    async function initializeWithVault() {
        if (!vaultId.trim()) {
            toast.error("Please enter a vault ID");
            return;
        }

        setApprovedOrderId(null);
        setShowExecute(false);

        try {
            setIsInitializing(true);

            const clientToken = await fetchVaultScopedClientToken(vaultId.trim());

            const paypal = (window as any).paypal;
            const sdkInstance = await paypal.createInstance({
                clientToken,
                components: ["paypal-payments", "paypal-saved-payment-methods", "paypal-messages"],
                pageType: "checkout",
            });
            sdkInstanceRef.current = sdkInstance;

            const paymentMethods = await safeFindEligibleMethods(sdkInstance, {
                currencyCode: "USD",
            });
            if (!paymentMethods) return;
            if (!paymentMethods.isEligible("paypal")) {
                toast.error("PayPal not eligible for this vault");
                return;
            }

            setupEditSavedPaymentSession(sdkInstance);
            sdkInstance.createPayPalMessages();

            toast.success("SDK initialized with vault-scoped token");
        } catch (e: any) {
            consola.error("initializeWithVault failed:", e);
            toast.error(`Init failed: ${e.message}`);
        } finally {
            setIsInitializing(false);
        }
    }

    // --- Edit-FI / SPM ---

    function setupEditSavedPaymentSession(sdkInstance: AppSdkInstance) {
        // Remove existing SPM element if present
        const existing = document.querySelector("#spm-element");
        if (existing) existing.remove();

        const el = document.createElement("paypal-saved-payment-methods");
        el.id = "spm-element";
        document.getElementById("spm-container")!.appendChild(el);

        const session = (sdkInstance as any).createPayPalEditSavedPaymentSession({
            commit: false,
            onApprove: async (data: any) => {
                const oid = data.orderId || data.orderID;
                if (!oid) {
                    consola.warn("[edit onApprove] no order id");
                    return;
                }
                setApprovedOrderId(oid);
                setShowExecute(true);
                consola.log("[edit onApprove] approved order:", oid);
                toast.success("Payment method updated — click Execute Order to capture");
            },
            onCancel: (data: any) => {
                consola.log("[edit onCancel]", data);
                toast("Edit cancelled", { icon: "⚠️" });
            },
            onError: (error: any) => {
                consola.error("[edit onError]", error);
                toast.error(`Edit error: ${error.message || JSON.stringify(error)}`);
            },
        });
        editSessionRef.current = session;

        el.addEventListener("click", async () => {
            try {
                const createOrderPromise = createOrderEditFi(vaultId.trim());
                await session.start(
                    { presentationMode: "auto" },
                    createOrderPromise,
                );
            } catch (err) {
                consola.error("SPM session start error:", err);
                handlePaymentError(err);
            }
        });
    }

    // --- Execute Order (capture after edit-FI approval) ---

    async function handleExecuteOrder() {
        if (!approvedOrderId) return;
        try {
            const captureData = await captureOrder({ orderId: approvedOrderId });
            setApprovedOrderId(null);
            setShowExecute(false);
            toast.success(`Order ${captureData.id || ""} captured!`);
        } catch (e: any) {
            toast.error(`Capture failed: ${e.message}`);
        }
    }

    // --- Pay Now (instant) ---

    async function handlePayNow() {
        if (!vaultId.trim()) {
            toast.error("Please enter a vault ID first");
            return;
        }
        const btn = document.querySelector("#pay-now-btn") as HTMLButtonElement | null;
        if (btn) btn.disabled = true;
        try {
            const orderData = await createOrderInstant(vaultId.trim(), fraudnetIdRef.current);
            if (orderData.status === "COMPLETED") {
                toast.success(`Order ${orderData.orderId} completed instantly!`);
                return;
            }
            // Fallback: capture if not already COMPLETED
            const captureData = await captureOrder({ orderId: orderData.orderId });
            toast.success(`Order ${captureData.id || ""} captured!`);
        } catch (e: any) {
            consola.error("Pay Now failed:", e);
            toast.error(`Pay Now failed: ${e.message}`);
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // --- Initial auto-init ---

    useEffect(() => {
        if (!ready) return;
        // Auto-init if vaultId is already loaded from active vault
        if (vaultId.trim()) {
            initializeWithVault();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, vaultId]);

    if (loading) return <div>Loading PayPal SDK…</div>;
    if (error) return <div>PayPal SDK load failed: {error.message}</div>;

    return (
        <div className="relative w-full space-y-4">
            <EligibilityOverlay
                isVisible={isInitializing}
                message="Initializing with vault-scoped token…"
            />

            {/* Vault ID input */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Vault ID</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={vaultId}
                        onChange={(e) => setVaultId(e.target.value)}
                        placeholder="Enter vault ID"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
                    />
                    <button
                        onClick={initializeWithVault}
                        disabled={isInitializing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        Set
                    </button>
                </div>
                {customerId && (
                    <p className="text-xs text-muted-foreground">
                        Customer: <code>{customerId}</code>
                    </p>
                )}
            </div>

            {/* Pay Now — instant one-click */}
            <div>
                <button
                    id="pay-now-btn"
                    onClick={handlePayNow}
                    disabled={isInitializing}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                    ⚡ Pay Now in One Click
                </button>
                <p className="text-xs text-muted-foreground mt-1">
                    Pays instantly with saved vault — no popup.
                </p>
            </div>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
            </div>

            {/* Edit-FI — SPM component */}
            <div>
                <p className="text-sm font-medium mb-2">
                    View / Edit Saved Payment Method
                </p>
                <div
                    id="spm-container"
                    className="min-h-[48px] border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg flex items-center justify-center p-2"
                >
                    <span className="text-sm text-muted-foreground">
                        Click &quot;Set&quot; with a vault ID to load saved methods
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Click the saved payment method above to edit — approve first, then capture.
                </p>
            </div>

            {/* Execute Order (shown after edit-FI approval) */}
            {showExecute && (
                <button
                    onClick={handleExecuteOrder}
                    className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
                >
                    ✅ Execute Order (Capture)
                </button>
            )}
        </div>
    );
}