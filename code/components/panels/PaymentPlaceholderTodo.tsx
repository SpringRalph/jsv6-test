import React from "react";

export default function PaymentPlaceholderTodo() {
    return (
        <div>
            <p className="font-semibold mb-3 flex items-center gap-2 text-base">
                <span className="text-xl">📝</span>
                TODO: PayPal SDK Integration
            </p>
            <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                    <span className="text-base mt-0.5">🔧</span>
                    <span>
                        Implement script loading in{" "}
                        <code className="text-xs bg-muted px-2 py-1 rounded border border-border font-mono">
                            lib/paypalScript.ts
                        </code>
                    </span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-base mt-0.5">🚀</span>
                    <span>Add PayPal SDK initialization with clientId</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-base mt-0.5">🎨</span>
                    <span>Render PayPal buttons or fields here</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-base mt-0.5">⚡</span>
                    <span>Handle payment callbacks and order creation</span>
                </li>
            </ul>
        </div>
    );
}
