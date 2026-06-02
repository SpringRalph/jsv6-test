"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardCopyInfoProps {
    cardNo: string;
    cardDate: string;
    cardCvv: string;
}

function CopyButton({
    value,
    label,
    displayValue,
}: {
    value: string;
    label: string;
    /** 显示用文本（可与 value 不同，例如卡号显示分组）；不传则用 value */
    displayValue?: string;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                {label}
            </span>
            <button
                onClick={handleCopy}
                title={`Copy ${label}`}
                className={cn(
                    "group flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-sm font-mono transition-all duration-200 min-w-0",
                    copied
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700",
                )}
            >
                <span className="truncate">{displayValue ?? value}</span>
                <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs opacity-60 group-hover:opacity-100 whitespace-nowrap">
                    {copied ? (
                        <>
                            <Check className="size-3.5" />
                            Copied
                        </>
                    ) : (
                        <>
                            <Copy className="size-3.5" />
                            Copy
                        </>
                    )}
                </span>
            </button>
        </div>
    );
}

/** 16 位卡号每 4 位插一个空格便于阅读，例 4111111111111111 → 4111 1111 1111 1111 */
function formatCardNumber(raw: string): string {
    return raw.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export default function CardCopyInfo({
    cardNo,
    cardDate,
    cardCvv,
}: CardCopyInfoProps) {
    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 shadow-xl shadow-slate-900/20">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-5 rounded bg-amber-400 shadow-sm" />
                <span className="text-white font-semibold text-sm tracking-wide">
                    Test Card
                </span>
                <span className="ml-auto text-xs text-slate-400 font-mono">
                    SANDBOX ONLY
                </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                <CopyButton
                    value={cardNo}
                    displayValue={formatCardNumber(cardNo)}
                    label="Card Number"
                />
                <CopyButton value={cardDate} label="Expiry" />
                <CopyButton value={cardCvv} label="CVV" />
            </div>
        </div>
    );
}
