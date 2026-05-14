"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
    useButtonStyleStore,
    ButtonColor,
    ButtonType,
    BorderRadiusPreset,
} from "@/store/useButtonStyleStore";

interface StyleControlPanelProps {
    isButtonReady: boolean;
    onApply: () => void;
}

const COLOR_OPTIONS: { value: ButtonColor; label: string; swatch: string }[] = [
    { value: "paypal-gold",   label: "Gold",   swatch: "#FFC439" },
    { value: "paypal-white",  label: "White",  swatch: "#FFFFFF" },
    { value: "paypal-black",  label: "Black",  swatch: "#2C2E2F" },
    { value: "paypal-silver", label: "Silver", swatch: "#EEEEEE" },
    { value: "paypal-blue",   label: "Blue",   swatch: "#003087" },
];

const TYPE_OPTIONS: { value: ButtonType; label: string }[] = [
    { value: "pay",       label: "Pay"       },
    { value: "buy-now",   label: "Buy Now"   },
    { value: "checkout",  label: "Checkout"  },
    { value: "donate",    label: "Donate"    },
    { value: "subscribe", label: "Subscribe" },
];

const RADIUS_OPTIONS: { value: BorderRadiusPreset; label: string }[] = [
    { value: "none", label: "None · 0px"  },
    { value: "sm",   label: "Small · 4px" },
    { value: "pill", label: "Pill · 55px" },
];

function OptionChip({
    selected,
    onClick,
    children,
}: {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "cursor-pointer select-none",
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md",
                "text-xs font-semibold border",
                "transition-all duration-100 ease-out",
                selected
                    ? [
                          // Clearly selected: deep indigo fill + strong inset + ring
                          "bg-indigo-600 text-white border-indigo-700",
                          "ring-2 ring-indigo-400 ring-offset-1",
                          "shadow-[inset_0_2px_4px_rgba(0,0,0,0.30)]",
                          "translate-y-px",
                      ]
                    : [
                          "bg-slate-100 text-foreground border-slate-200",
                          "shadow-[0_1px_0_0_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.80)]",
                          "hover:bg-slate-50 hover:border-indigo-300",
                          "hover:shadow-[0_2px_0_0_rgba(0,0,0,0.10),0_4px_8px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.90)]",
                          "hover:-translate-y-0.5",
                          "active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] active:translate-y-px",
                      ]
            )}
        >
            {/* Selected tick */}
            {selected && (
                <svg
                    className="w-3 h-3 shrink-0"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="2,6 5,9 10,3" />
                </svg>
            )}
            {children}
        </button>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {children}
        </p>
    );
}

export default function StyleControlPanel({
    isButtonReady,
    onApply,
}: StyleControlPanelProps) {
    const {
        color,
        type,
        borderRadiusPreset,
        width,
        height,
        setProp,
        reset,
    } = useButtonStyleStore();

    return (
        <div className="rounded-xl border border-border bg-card p-5 space-y-5 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Style Controls</span>
                <button
                    type="button"
                    onClick={reset}
                    className={cn(
                        "cursor-pointer select-none text-xs font-medium px-2.5 py-1 rounded-md border",
                        "text-muted-foreground border-slate-200 bg-slate-100",
                        "shadow-[0_1px_0_0_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.80)]",
                        "hover:bg-slate-50 hover:border-indigo-300 hover:text-foreground",
                        "hover:shadow-[0_2px_0_0_rgba(0,0,0,0.10),0_4px_8px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.90)]",
                        "hover:-translate-y-0.5",
                        "active:translate-y-px active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)]",
                        "transition-all duration-100"
                    )}
                >
                    ↺ Reset
                </button>
            </div>

            {/* Color */}
            <div>
                <SectionLabel>Color</SectionLabel>
                <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((opt) => (
                        <OptionChip
                            key={opt.value}
                            selected={color === opt.value}
                            onClick={() => setProp("color", opt.value)}
                        >
                            <span
                                className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: opt.swatch }}
                            />
                            {opt.label}
                        </OptionChip>
                    ))}
                </div>
            </div>

            {/* Type */}
            <div>
                <SectionLabel>Button Type</SectionLabel>
                <div className="flex flex-wrap gap-2">
                    {TYPE_OPTIONS.map((opt) => (
                        <OptionChip
                            key={opt.value}
                            selected={type === opt.value}
                            onClick={() => setProp("type", opt.value)}
                        >
                            {opt.label}
                        </OptionChip>
                    ))}
                </div>
            </div>

            {/* Border Radius */}
            <div>
                <SectionLabel>Border Radius</SectionLabel>
                <div className="flex flex-wrap gap-2">
                    {RADIUS_OPTIONS.map((opt) => (
                        <OptionChip
                            key={opt.value}
                            selected={borderRadiusPreset === opt.value}
                            onClick={() => setProp("borderRadiusPreset", opt.value)}
                        >
                            {opt.label}
                        </OptionChip>
                    ))}
                </div>
            </div>

            {/* Width */}
            <div>
                <SectionLabel>
                    Width —{" "}
                    <span className="normal-case font-normal text-foreground">
                        {width}px
                    </span>
                </SectionLabel>
                <input
                    type="range"
                    min={150}
                    max={500}
                    value={width}
                    onChange={(e) => setProp("width", Number(e.target.value))}
                    className="w-full cursor-pointer accent-primary"
                />
            </div>

            {/* Height */}
            <div>
                <SectionLabel>
                    Height —{" "}
                    <span className="normal-case font-normal text-foreground">
                        {height}px
                    </span>
                </SectionLabel>
                <input
                    type="range"
                    min={35}
                    max={55}
                    value={height}
                    onChange={(e) => setProp("height", Number(e.target.value))}
                    className="w-full cursor-pointer accent-primary"
                />
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Apply Button */}
            <button
                type="button"
                onClick={onApply}
                disabled={!isButtonReady}
                className={cn(
                    "w-full py-2.5 rounded-lg text-sm font-semibold",
                    "transition-all duration-100 ease-out",
                    isButtonReady
                        ? [
                              "cursor-pointer",
                              "bg-indigo-600 text-white border border-indigo-700",
                              "shadow-[0_2px_0_0_rgba(0,0,0,0.20),0_4px_12px_rgba(99,102,241,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]",
                              "hover:bg-indigo-500 hover:border-indigo-600",
                              "hover:shadow-[0_3px_0_0_rgba(0,0,0,0.22),0_6px_18px_rgba(99,102,241,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]",
                              "hover:-translate-y-0.5",
                              "active:translate-y-px active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.25)]",
                          ]
                        : [
                              "cursor-not-allowed",
                              "bg-slate-200 text-slate-400 border border-slate-300",
                          ]
                )}
            >
                {isButtonReady ? "✓  Apply Styles" : "Waiting for PayPal button to render…"}
            </button>
        </div>
    );
}
