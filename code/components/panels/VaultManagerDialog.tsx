"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
    CreditCard,
    Trash2,
    CheckCircle2,
    RefreshCw,
    DatabaseZap,
    ChevronRight,
} from "lucide-react";
import type { VaultPaymentMethod, PaymentType } from "@/db/vaultDb";

type PaymentTypeConfig = {
    label: string;
    icon: React.ReactNode;
    color: string;
    dot: string;
};

function PaymentIcon({ src, alt }: { src: string; alt: string }) {
    return (
        <span className="flex items-center justify-center w-6 h-6 shrink-0">
            <Image src={src} alt={alt} width={20} height={20} className="object-contain" />
        </span>
    );
}

const PAYMENT_TYPE_CONFIG: Record<PaymentType, PaymentTypeConfig> = {
    paypal: {
        label: "PayPal",
        icon: <PaymentIcon src="/payment-area-icon/paypal-circle.svg" alt="PayPal" />,
        color: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
        dot: "bg-blue-400",
    },
    card: {
        label: "Card",
        icon: <CreditCard className="w-4 h-4" />,
        color: "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
        dot: "bg-purple-400",
    },
    apple_pay: {
        label: "Apple Pay",
        icon: <PaymentIcon src="/payment-area-icon/apple-fill.svg" alt="Apple Pay" />,
        color: "bg-zinc-50 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700",
        dot: "bg-zinc-400",
    },
    google_pay: {
        label: "Google Pay",
        icon: <PaymentIcon src="/payment-area-icon/google.svg" alt="Google Pay" />,
        color: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
        dot: "bg-green-400",
    },
    venmo: {
        label: "Venmo",
        icon: <PaymentIcon src="/payment-area-icon/Venmo.svg" alt="Venmo" />,
        color: "bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800",
        dot: "bg-cyan-400",
    },
};

function PaymentTypeTag({ type }: { type: PaymentType }) {
    const config = PAYMENT_TYPE_CONFIG[type] ?? PAYMENT_TYPE_CONFIG.paypal;
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.color}`}
        >
            {config.icon}
            {config.label}
        </span>
    );
}

function VaultCard({
    m,
    actionLoading,
    onSetActive,
    onDelete,
}: {
    m: VaultPaymentMethod;
    actionLoading: string | null;
    onSetActive: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const isActive = m.is_active === 1;
    const config = PAYMENT_TYPE_CONFIG[m.payment_type] ?? PAYMENT_TYPE_CONFIG.paypal;

    return (
        <div
            className={`rounded-2xl border-2 transition-all overflow-hidden ${
                isActive
                    ? "border-green-400 dark:border-green-600 shadow-sm shadow-green-100 dark:shadow-green-900/20"
                    : "border-border"
            }`}
        >
            {/* Card header */}
            <div className={`px-4 py-3 flex items-center gap-3 ${isActive ? "bg-green-50 dark:bg-green-950/30" : "bg-muted/40"}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
                <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
                    <PaymentTypeTag type={m.payment_type} />
                    {isActive && (
                        <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs gap-1 rounded-lg py-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                        </Badge>
                    )}
                </div>
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                    {m.vault_id.slice(0, 8)}…
                </span>
            </div>

            {/* Card body */}
            <div className="px-4 py-3 bg-card space-y-1.5">
                <InfoRow label="Vault ID" value={m.vault_id} mono />
                {m.customer_id && <InfoRow label="Customer" value={m.customer_id} mono />}
                {m.email && <InfoRow label="Email" value={m.email} />}
                {m.payment_type === "card" && m.card_brand && (
                    <InfoRow
                        label="Card"
                        value={`${m.card_brand} ···· ${m.card_last_four}${m.card_expiry ? ` (${m.card_expiry})` : ""}`}
                    />
                )}
                <InfoRow label="Saved" value={new Date(m.created_at).toLocaleString()} />
            </div>

            {/* Card actions */}
            <div className="px-4 py-2.5 bg-muted/30 border-t border-border flex items-center gap-2 justify-end flex-wrap">
                {!isActive && (
                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs gap-1.5 rounded-lg"
                        disabled={actionLoading === m.id + "_active"}
                        onClick={() => onSetActive(m.id)}
                    >
                        {actionLoading === m.id + "_active" ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                        )}
                        Set Active
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs gap-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    disabled={actionLoading === m.id + "_delete"}
                    onClick={() => onDelete(m.id)}
                >
                    {actionLoading === m.id + "_delete" ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                        <Trash2 className="w-3 h-3" />
                    )}
                    Delete
                </Button>
            </div>
        </div>
    );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex gap-3 text-xs">
            <span className="text-muted-foreground w-16 shrink-0">{label}</span>
            <span className={`truncate ${mono ? "font-mono" : ""}`}>{value}</span>
        </div>
    );
}

export function VaultManagerDialog() {
    const [open, setOpen] = useState(false);
    const [methods, setMethods] = useState<VaultPaymentMethod[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const isMock = process.env.NEXT_PUBLIC_VAULT_MOCK === "true";
    const apiBase = isMock ? "/api/vault/mock" : "/api/vault";

    const fetchMethods = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(apiBase);
            const data = await res.json();
            setMethods(data.methods ?? []);
        } catch {
            setMethods([]);
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    useEffect(() => {
        if (open) fetchMethods();
    }, [open, fetchMethods]);

    async function handleSetActive(id: string) {
        setActionLoading(id + "_active");
        try {
            if (!isMock) await fetch(`/api/vault/${id}`, { method: "PATCH" });
            await fetchMethods();
        } finally {
            setActionLoading(null);
        }
    }

    async function handleDelete(id: string) {
        setActionLoading(id + "_delete");
        try {
            if (!isMock) await fetch(`/api/vault/${id}`, { method: "DELETE" });
            await fetchMethods();
        } finally {
            setActionLoading(null);
        }
    }

    const activeMethod = methods.find((m) => m.is_active === 1);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2 shadow-md hover:shadow-lg transition-shadow">
                    <DatabaseZap className="w-4 h-4" />
                    Vault Manager
                    {activeMethod && (
                        <span className="w-2 h-2 rounded-full bg-green-500" title="Active vault set" />
                    )}
                </Button>
            </DialogTrigger>

            <DialogContent className="w-full max-w-lg sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col bg-white dark:bg-zinc-900 p-0 gap-0 rounded-2xl overflow-hidden">
                {/* Header */}
                <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                            <DatabaseZap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </span>
                        Vault Payment Methods
                    </DialogTitle>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground">
                            {methods.length} saved method{methods.length !== 1 ? "s" : ""}
                            {activeMethod && (
                                <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                                    · Active: {activeMethod.vault_id.slice(0, 12)}…
                                </span>
                            )}
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchMethods}
                            disabled={loading}
                            className="h-7 gap-1 text-xs"
                        >
                            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {loading && methods.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                            <RefreshCw className="w-6 h-6 animate-spin" />
                            <span className="text-sm">Loading vault methods…</span>
                        </div>
                    )}

                    {!loading && methods.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                            <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-muted">
                                <DatabaseZap className="w-7 h-7 text-muted-foreground" />
                            </span>
                            <div>
                                <p className="text-sm font-medium">No vault methods yet</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Complete a vault save flow to add one.
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
                        </div>
                    )}

                    {methods.map((m) => (
                        <VaultCard
                            key={m.id}
                            m={m}
                            actionLoading={actionLoading}
                            onSetActive={handleSetActive}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
