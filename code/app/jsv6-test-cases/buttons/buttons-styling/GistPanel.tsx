"use client";

import Gist from "react-gist";

export default function GistPanel() {
    return (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                PayPal JS V6 Style Reference
            </p>
            <Gist id="597f3ffc03b89a3f4876dd5d4a5011e0" />
        </div>
    );
}
