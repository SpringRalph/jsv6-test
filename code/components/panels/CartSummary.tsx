"use client"

import { useCartTotal } from "@/store/useCartStore"
import { Card } from "@/components/ui/Card"

export function CartSummary() {
  const total = useCartTotal()

  return (
    <Card className="p-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 -z-10" />

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">🛒</span>
        Cart Summary
      </h2>
      <div className="space-y-3">
        <div className="flex justify-between text-lg bg-muted/50 p-3 rounded-lg">
          <span className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            Subtotal:
          </span>
          <span className="font-semibold">${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold border-t-2 border-dashed border-border pt-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-4 rounded-lg">
          <span className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            Total:
          </span>
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
    </Card>
  )
}
