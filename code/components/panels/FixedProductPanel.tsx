"use client";

import { useCartStore, useCartTotal } from "@/store/useCartStore";
import { Card } from "@/components/ui/Card";

export function FixedProductPanel() {
    const { product, quantity } = useCartStore();
    const total = useCartTotal();

    return (
        <Card className="p-6 border-2 border-green-200 dark:border-green-800 shadow-lg relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-500/10 to-transparent rounded-full blur-3xl -z-10" />

            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🛍️</span>
                Test Product
            </h2>
            <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 p-4 rounded-xl border border-green-200 dark:border-green-800">
                    <h3 className="font-medium text-lg flex items-center gap-2">
                        <span className="text-xl">📦</span>
                        {product.title}
                    </h3>
                    <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mt-2 flex items-center gap-2">
                        <span className="text-xl">💵</span>$
                        {product.price.toFixed(2)}
                    </p>
                </div>

                <div className="flex items-center space-x-4 bg-muted/50 p-4 rounded-xl border border-border">
                    <span className="text-sm font-medium flex items-center gap-2">
                        <span className="text-lg">🔢</span>
                        Quantity:
                    </span>
                    <div className="flex items-center space-x-2">
                        <span className="w-12 text-center font-semibold text-xl bg-background px-4 py-2 rounded-lg border-2 border-primary/30">
                            {quantity}
                        </span>
                    </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-xl border border-border">
                    <p className="text-sm font-medium">
                        Total:{" "}
                        <span className="font-bold text-lg">
                            ${total.toFixed(2)}
                        </span>
                    </p>
                </div>
            </div>
        </Card>
    );
}
