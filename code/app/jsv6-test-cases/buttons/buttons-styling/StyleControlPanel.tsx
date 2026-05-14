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
                // base
                "cursor-pointer select-none",
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md",
                "text-xs font-semibold border",
                // 3-D lift effect via box-shadow
                "transition-all duration-100 ease-out",
                selected
                    ? [
                          "bg-primary text-primary-foreground border-primary/80",
                          // pressed-in look: top highlight gone, bottom shadow collapsed
                          "shadow-[inset_0_1px_3px_rgba(0,0,0,0.25)]",
                          "translate-y-px",
                      ]
                    : [
                          "bg-white text-foreground border-border",
                          // raised: bright top edge + dark bottom edge + drop shadow
                          "shadow-[0_1px_0_0_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]",
                          "hover:shadow-[0_2px_0_0_rgba(0,0,0,0.10),0_4px_8px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.95)]",
                          "hover:-translate-y-0.5",
                          "active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.18)]",
                          "active:translate-y-px",
                      ]
            )}
        >
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
        markBorderRadius,
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
                        "text-muted-foreground border-border bg-white",
                        "shadow-[0_1px_0_0_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]",
                        "hover:shadow-[0_2px_0_0_rgba(0,0,0,0.10),0_4px_8px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.95)]",
                        "hover:-translate-y-0.5 hover:text-foreground",
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

            {/* Mark Border Radius */}
            <div>
                <SectionLabel>
                    Mark Border Radius —{" "}
                    <span className="normal-case font-normal text-foreground">
                        {markBorderRadius}px
                    </span>
                </SectionLabel>
                <input
                    type="range"
                    min={0}
                    max={30}
                    value={markBorderRadius}
                    onChange={(e) => setProp("markBorderRadius", Number(e.target.value))}
                    className="w-full cursor-pointer accent-primary"
                />
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
                              "bg-primary text-primary-foreground border border-primary/80",
                              "shadow-[0_2px_0_0_rgba(0,0,0,0.18),0_4px_10px_rgba(59,130,246,0.30),inset_0_1px_0_rgba(255,255,255,0.15)]",
                              "hover:shadow-[0_3px_0_0_rgba(0,0,0,0.20),0_6px_16px_rgba(59,130,246,0.40),inset_0_1px_0_rgba(255,255,255,0.15)]",
                              "hover:-translate-y-0.5",
                              "active:translate-y-px active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.20)]",
                          ]
                        : [
                              "cursor-not-allowed",
                              "bg-muted text-muted-foreground border border-border",
                          ]
                )}
            >
                {isButtonReady ? "✓  Apply Styles" : "Waiting for PayPal button to render…"}
            </button>
        </div>
    );
}
