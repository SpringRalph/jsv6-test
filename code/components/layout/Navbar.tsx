"use client"

import { useEnvStore } from "@/store/useEnvStore"
import { maskClientId } from "@/lib/storage"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { clientId, env } = useEnvStore()
  const isLive = env === "live"

  return (
    <nav
      className={cn(
        "border-b-2 shadow-md relative transition-colors duration-300",
        isLive
          ? "border-amber-500 bg-amber-50 dark:bg-amber-950"
          : "border-border bg-card",
      )}
    >
      {/* background gradient overlay */}
      <div
        className={cn(
          "absolute inset-0 -z-10",
          isLive
            ? "bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5"
            : "bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5",
        )}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-3xl group-hover:scale-110 transition-transform">💳</span>
            <span
              className={cn(
                "text-xl font-bold bg-clip-text text-transparent",
                isLive
                  ? "bg-gradient-to-r from-amber-600 to-orange-600"
                  : "bg-gradient-to-r from-blue-600 to-purple-600",
              )}
            >
              PayPal Test Framework
            </span>
          </Link>

          <div className="flex items-center space-x-3">
            {isLive && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                You are now in Live
              </div>
            )}

            {clientId && (
              <div className={cn(
                "text-sm px-4 py-2 rounded-full border flex items-center gap-2",
                isLive
                  ? "bg-amber-100/60 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700"
                  : "bg-muted/50 border-border",
              )}>
                <span className="text-base">🔑</span>
                <span className="text-muted-foreground">Client ID:</span>
                <span className="font-mono font-semibold text-primary">{maskClientId(clientId)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
