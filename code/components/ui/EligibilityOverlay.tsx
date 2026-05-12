"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ColorConsoleHelper } from "@/lib/colorConsoleHelper";

interface EligibilityOverlayProps {
    isVisible: boolean;
    message?: string;
}

export function EligibilityOverlay({
    isVisible,
    message = "Checking eligibility…",
}: EligibilityOverlayProps) {
    const mountStart = useRef(performance.now());

    useEffect(() => {
        return () => {
            ColorConsoleHelper.cyan(
                `[EligibilityOverlay] Component mounted for ${(performance.now() - mountStart.current).toFixed(2)} ms`,
            );
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-slate-900/85 px-4 py-2 text-sm text-white shadow-lg shadow-slate-950/25">
                <Spinner className="size-4 text-white" />
                <span>{message}</span>
            </div>
        </div>
    );
}
