"use client";

import React from "react";
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

const COLOR_OPTIONS: { value: ButtonColor; label: string; bg: string }[] = [
    { value: "paypal-gold", label: "Gold", bg: "#FFC439" },
    { value: "paypal-white", label: "White", bg: "#FFFFFF" },
    { value: "paypal-black", label: "Black", bg: "#2C2E2F" },
    { value: "paypal-silver", label: "Silver", bg: "#EEEEEE" },
    { value: "paypal-blue", label: "Blue", bg: "#003087" },
];

const TYPE_OPTIONS: { value: ButtonType; label: string }[] = [
    { value: "pay", label: "Pay" },
    { value: "buy-now", label: "Buy Now" },
    { value: "checkout", label: "Checkout" },
    { value: "donate", label: "Donate" },
    { value: "subscribe", label: "Subscribe" },
];

const RADIUS_OPTIONS: { value: BorderRadiusPreset; label: string }[] = [
    { value: "none", label: "None (0px)" },
    { value: "sm", label: "Small (4px)" },
    { value: "pill", label: "Pill (55px)" },
];

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
        <div className="border rounded-lg p-4 bg-card space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Style Controls</h3>
                <button
                    onClick={reset}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                    Reset defaults
                </button>
            </div>

            {/* Color */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Color
                </label>
                <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setProp("color", opt.value)}
                            title={opt.label}
                            className={`
                                flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all
                                ${color === opt.value
                                    ? "border-primary ring-1 ring-primary"
                                    : "border-border hover:border-muted-foreground"
                                }
                            `}
                        >
                            <span
                                className="w-3 h-3 rounded-full border border-border/50 shrink-0"
                                style={{ backgroundColor: opt.bg }}
                            />
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Type */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Button Type
                </label>
                <div className="flex flex-wrap gap-2">
                    {TYPE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setProp("type", opt.value)}
                            className={`
                                px-2.5 py-1 rounded-md border text-xs font-medium transition-all
                                ${type === opt.value
                                    ? "border-primary bg-primary/5 ring-1 ring-primary text-primary"
                                    : "border-border hover:border-muted-foreground"
                                }
                            `}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Border Radius
                </label>
                <div className="flex flex-wrap gap-2">
                    {RADIUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setProp("borderRadiusPreset", opt.value)}
                            className={`
                                px-2.5 py-1 rounded-md border text-xs font-medium transition-all
                                ${borderRadiusPreset === opt.value
                                    ? "border-primary bg-primary/5 ring-1 ring-primary text-primary"
                                    : "border-border hover:border-muted-foreground"
                                }
                            `}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mark Border Radius */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Mark Border Radius{" "}
                    <span className="normal-case font-normal text-foreground">
                        {markBorderRadius}px
                    </span>
                </label>
                <input
                    type="range"
                    min={0}
                    max={30}
                    value={markBorderRadius}
                    onChange={(e) =>
                        setProp("markBorderRadius", Number(e.target.value))
                    }
                    className="w-full accent-primary"
                />
            </div>

            {/* Width */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Width{" "}
                    <span className="normal-case font-normal text-foreground">
                        {width}px
                    </span>
                </label>
                <input
                    type="range"
                    min={150}
                    max={500}
                    value={width}
                    onChange={(e) => setProp("width", Number(e.target.value))}
                    className="w-full accent-primary"
                />
            </div>

            {/* Height */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Height{" "}
                    <span className="normal-case font-normal text-foreground">
                        {height}px
                    </span>
                </label>
                <input
                    type="range"
                    min={35}
                    max={55}
                    value={height}
                    onChange={(e) => setProp("height", Number(e.target.value))}
                    className="w-full accent-primary"
                />
            </div>

            {/* Apply Button */}
            <button
                onClick={onApply}
                disabled={!isButtonReady}
                className={`
                    w-full py-2 rounded-md text-sm font-semibold transition-all
                    ${isButtonReady
                        ? "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98]"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }
                `}
            >
                {isButtonReady ? "Apply Styles" : "Waiting for button to render…"}
            </button>
        </div>
    );
}
