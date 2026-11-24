"use client";

import React, { useEffect, useState, useRef } from "react";
import consola from "consola";
import toast from "react-hot-toast";
import { EligibilityOverlay } from "@/components/ui/EligibilityOverlay";
import { usePayPalWebSdk } from "@/hooks/usePayPalWebSdk";
import {
    createOrderInstant,
    createOrderEditFi,
    captureOrder,
    handlePaymentError,
} from "@/services/paypal-sdk-function/browser-function";
import { AppSdkInstance } from "@/services/paypal-sdk-function/paypalSharedObject";
import { safeFindEligibleMethods } from "@/services/paypal-sdk-function/safe-find-eligible-methods";
import { getPayPalHeaders } from "@/services/paypal-sdk-function/paypal-headers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fetch a vault-scoped client token from the server. */
async function fetchVaultScopedClientToken(vaultId: string): Promise<string> {
    const params = new URLSearchParams();
    if (vaultId) params.append("vaultId", vaultId);

    const url = `/api/paypal/client-token${params.toString() ? "?" + params.toString() : ""}`;
    const res = await fetch(url, { headers: getPayPalHeaders() });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch vault-scoped client token: ${text}`);
    }
    const json = await res.json();
    if (!json?.clientToken) throw new Error("No clientToken in response");
    return json.clientToken;
}

/**
 * Inject the FraudNet fncls script tag + fb.js loader.
 *
 * Reference pattern:
 *   <script type="application/json" fncls="fnparams-dede7cc5-...">
 *     { "f": "<fraudnetSessionId>", "s": "editfi-return-buyer-instant-checkout" }
 *   </script>
 *   <script src="https://c.paypal.com/da/r/fb.js"></script>
 *
 * "f" must be the same id sent as PayPal-Client-Metadata-Id on the
 * create-order call it's meant to protect, so this function returns the
 * generated session id for the caller to stash.
 */
function injectFraudNet(): string {
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 15);

    // fncls JSON script
    const fnScript = document.createElement("script");
    fnScript.type = "application/json";
    fnScript.setAttribute(
        "fncls",
        "fnparams-dede7cc5-15fd-4c75-a9f4-36c430ee3a99",
    );
    fnScript.textContent = JSON.stringify({
        f: sessionId,
        s: "editfi-return-buyer-instant-checkout",
    });
    document.body.appendChild(fnScript);

    // fb.js loader
    const fbScript = document.createElement("script");
    fbScript.src = "https://c.paypal.com/da/r/fb.js";
    document.body.appendChild(fbScript);

    return sessionId;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ButtonReturnBuyer() {
    // ---- SDK readiness ---------------------------------------------------
    const { ready, loading, error: sdkError } = usePayPalWebSdk();

    // ---- state -----------------------------------------------------------
    const [isInitializing, setIsInitializing] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const [vaultId, setVaultId] = useState("");
    const [customerId, setCustomerId] = useState("");

    const [approvedOrderId, setApprovedOrderId] = useState<string | null>(null);
    const [showExecute, setShowExecute] = useState(false);

    const [paypalEligible, setPaypalEligible] = useState(false);
    const [paylaterEligible, setPaylaterEligible] = useState(false);

    // ---- refs (mutable holders so callbacks always see latest values) -----
    const sdkInstanceRef = useRef<AppSdkInstance | null>(null);
    const editSessionRef = useRef<any>(null);
    const fraudnetIdRef = useRef("");

    // ---- inject FraudNet on mount ----------------------------------------
    useEffect(() => {
        fraudnetIdRef.current = injectFraudNet();
    }, []);

    // ---- load active vault on mount --------------------------------------
    useEffect(() => {
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
    }, []);

    // ---- SDK initialisation (triggered by "Set" button) ------------------

    async function initializeWithVault() {
        const vid = vaultId.trim();
        if (!vid) {
            toast.error("Please enter a vault ID");
            return;
        }

        if (!ready || !(window as any).paypal) {
            toast.error("PayPal SDK not ready yet — please wait a moment and try again");
            return;
        }

        setApprovedOrderId(null);
        setShowExecute(false);

        try {
            setIsInitializing(true);

            // 1) Fetch vault-scoped client token
            const clientToken = await fetchVaultScopedClientToken(vid);

            // 2) createInstance — one-shot init for ALL components
            const paypal = (window as any).paypal;
            const sdkInstance = await paypal.createInstance({
                clientToken,
                components: [
                    "paypal-payments",
                    "paypal-saved-payment-methods",
                    "paypal-messages",
                ],
                pageType: "checkout",
            });
            sdkInstanceRef.current = sdkInstance;

            // 3) findEligibleMethods → branch by eligibility
            const paymentMethods = await safeFindEligibleMethods(sdkInstance, {
                currencyCode: "USD",
            });
            if (!paymentMethods) {
                toast.error("Eligibility check failed");
                return;
            }

            const ppEligible = paymentMethods.isEligible("paypal");
            const plEligible = paymentMethods.isEligible("paylater");
            setPaypalEligible(ppEligible);
            setPaylaterEligible(plEligible);

            if (!ppEligible && !plEligible) {
                toast.error("Neither PayPal nor Pay Later is eligible for this vault");
                return;
            }

            // 4) Independent branches (each gets its own try/catch)
            if (ppEligible) {
                try {
                    setupEditSavedPaymentSession(sdkInstance, vid);
                } catch (e: any) {
                    consola.error("setupEditSavedPaymentSession failed:", e);
                }
            }

            // 5) Messaging
            try {
                sdkInstance.createPayPalMessages();
            } catch (e: any) {
                consola.error("createPayPalMessages failed:", e);
            }

            setInitialized(true);
            toast.success("SDK initialized with vault-scoped token");
        } catch (e: any) {
            consola.error("initializeWithVault failed:", e);
            toast.error(`Init failed: ${e.message}`);
        } finally {
            setIsInitializing(false);
        }
    }

    // ---- Edit-FI / SPM ---------------------------------------------------

    function setupEditSavedPaymentSession(sdkInstance: AppSdkInstance, vid: string) {
        // Remove previous element if re-initialising
        const old = document.querySelector("#spm-element");
        if (old) old.remove();

        // 1) Element MUST be in the DOM before creating the session
        const el = document.createElement("paypal-saved-payment-methods");
        el.id = "spm-element";
        const container = document.getElementById("spm-container")!;
        container.appendChild(el);
        consola.log("[setupSPM] element appended to DOM:", {
            tagName: el.tagName,
            id: el.id,
            parentId: container.id,
            inDOM: document.contains(el),
        });

        // 2) commit:false → onApprove does NOT capture
        consola.log("[setupSPM] creating createPayPalEditSavedPaymentSession...");
        const session = (sdkInstance as any).createPayPalEditSavedPaymentSession({
            commit: false,
            onApprove: async (data: any) => {
                const oid = data.orderId || data.orderID;
                consola.log("[edit onApprove]", { orderId: oid, data });
                if (!oid) {
                    consola.warn("[edit onApprove] no order id");
                    return;
                }
                setApprovedOrderId(oid);
                setShowExecute(true);
                consola.log("[edit onApprove] FI edited & approved — order:", oid);
                toast.success("Payment method updated — click Execute Order to capture");
            },
            onCancel: (data: any) => {
                consola.log("[edit onCancel]", data);
                toast("Edit cancelled", { icon: "⚠️" });
            },
            onError: (error: any) => {
                consola.error("[edit onError]", error.code, error.message);
                toast.error(`Edit error: ${error.message || JSON.stringify(error)}`);
            },
        });
        editSessionRef.current = session;
        consola.log("[setupSPM] session created, editSessionRef set");

        // 3) The element's edit control drives the session
        consola.log("[setupSPM] attaching click listener to SPM element...");
        el.addEventListener("click", async () => {
            consola.log("[setupSPM] SPM element clicked! starting session...");
            try {
                await session.start(
                    { presentationMode: "auto" },
                    createOrderEditFi(vid),
                );
            } catch (err) {
                consola.error("SPM session start error:", err);
                handlePaymentError(err);
            }
        });
        consola.log("[setupSPM] done — SPM should now render as a clickable payment method");
    }

    // ---- Execute Order (capture after edit-FI approval) ------------------

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

    // ---- Pay Now (instant) ------------------------------------------------

    async function handlePayNow() {
        const vid = vaultId.trim();
        if (!vid) {
            toast.error("Please enter a vault ID first");
            return;
        }
        const btn = document.querySelector("#pay-now-btn") as HTMLButtonElement | null;
        if (btn) btn.disabled = true;
        try {
            // Pass FraudNet session ID — must match the "f" field in the fncls script
            const orderData = await createOrderInstant(vid, fraudnetIdRef.current);
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

    // ---- render ----------------------------------------------------------

    if (loading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading PayPal SDK…</div>;
    if (sdkError) return <div className="py-8 text-center text-sm text-red-500">PayPal SDK load failed: {sdkError.message}</div>;

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
            {initialized && paypalEligible && (
                <div>
                    <button
                        id="pay-now-btn"
                        onClick={handlePayNow}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                        ⚡ Pay Now in One Click
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">
                        Pays instantly with saved vault — no popup.
                    </p>
                </div>
            )}

            {/* Divider */}
            {initialized && paypalEligible && (
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                </div>
            )}

            {/* Edit-FI — SPM component */}
            <div className={initialized && paypalEligible ? "" : "hidden"}>
                <p className="text-sm font-medium mb-2">
                    View / Edit Saved Payment Method
                </p>
                <div className="spm-row flex items-center gap-2">
                    <img
                        src="https://www.paypalobjects.com/js-sdk-logos/2.3.2/paypal-mark.svg"
                        alt="PayPal"
                        className="spm-mark h-6"
                    />
                    <span className="spm-mark-label text-sm text-muted-foreground">
                        PayPal
                    </span>
                    <div
                        id="spm-container"
                        className="min-h-[48px] flex items-center justify-center p-2 flex-1"
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Click the saved payment method above to edit — approve first,
                    then capture.
                </p>
            </div>

            {/* Initial state */}
            {!initialized && (
                <p className="text-sm text-muted-foreground text-center py-4">
                    Enter a vault ID and click <strong>Set</strong> to load saved
                    payment methods.
                </p>
            )}

            {/* Execute Order (shown after edit-FI approval) */}
            {showExecute && (
                <button
                    onClick={handleExecuteOrder}
                    className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700"
                >
                    ✅ Execute Order (Capture)
                </button>
            )}

            {/* Pay Later button (eligibility-driven) */}
            {initialized && paylaterEligible && (
                <div className="mt-4">
                    <paypal-pay-later-button
                        id="paylater-button"
                        hidden
                        className="buttonsV6"
                    />
                </div>
            )}
        </div>
    );
}