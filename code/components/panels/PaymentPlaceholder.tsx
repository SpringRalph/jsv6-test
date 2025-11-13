import { Card } from "@/components/ui/Card";
import PaymentPlaceholderTodo from "./PaymentPlaceholderTodo";
import { ReactNode } from "react";

interface PaymentPlaceholderProps {
    scenario: string;
    children?: ReactNode;
}

export function PaymentPlaceholder({ scenario, children }: PaymentPlaceholderProps) {
    return (
        <Card className="p-6 border-2 border-orange-200 dark:border-orange-800 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-yellow-500/5 to-transparent -z-10" />

            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">💳</span>
                Payment Area
            </h2>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 rounded-xl p-8 text-center space-y-4 border-2 border-dashed border-orange-300 dark:border-orange-700">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full blur-xl opacity-30 animate-pulse" />
                    <div className="relative text-7xl animate-bounce-slow">
                        💳
                    </div>
                </div>
                <h3 className="text-lg font-medium flex items-center justify-center gap-2">
                    <span className="text-xl">🔌</span>
                    PayPal Integration Placeholder
                </h3>
                <div className="inline-flex items-center gap-2 bg-background px-4 py-2 rounded-full border-2 border-orange-300 dark:border-orange-700">
                    <span className="text-sm font-medium">Scenario:</span>
                    <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
                        {scenario}
                    </span>
                </div>
                <div className="bg-background p-5 rounded-xl border-2 border-border text-left text-sm shadow-inner">
                    {children ?? <PaymentPlaceholderTodo />}
                </div>
            </div>
        </Card>
    );
}
