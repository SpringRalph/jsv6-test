"use client"

import { useEnvStore } from "@/store/useEnvStore"
import { maskClientId } from "@/lib/storage"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Wallet } from "lucide-react"

export function Navbar() {
  const { env, activeClientId } = useEnvStore()
  const isLive = env === "live"
  const currentClientId = activeClientId()

  return (
    <nav
      className={cn(
        "border-b-2 shadow-md relative transition-colors duration-300",
        isLive
          ? "border-amber-500 bg-amber-50 dark:bg-amber-950"
          : "border-border bg-card",
      )}
    >
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

          {/* Logo + title */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-transform group-hover:scale-110",
                isLive
                  ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-300/50 shadow-md"
                  : "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-blue-300/50 shadow-md",
              )}
            >
              <Wallet className="w-4.5 h-4.5" strokeWidth={2} />
            </span>
            <span
              className={cn(
                "text-xl font-bold leading-none bg-clip-text text-transparent",
                isLive
                  ? "bg-gradient-to-r from-amber-600 to-orange-600"
                  : "bg-gradient-to-r from-blue-600 to-purple-600",
              )}
            >
              PayPal Test Framework
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isLive && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                You are now in Live
              </div>
            )}

            {currentClientId && (
              <div
                className={cn(
                  "flex items-center gap-2 text-sm px-3.5 py-1.5 rounded-full border",
                  isLive
                    ? "bg-amber-100/60 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700"
                    : "bg-muted/50 border-border",
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded",
                    isLive
                      ? "bg-amber-500 text-white"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                  )}
                >
                  {isLive ? "LIVE" : "SBX"}
                </span>
                <span className="text-muted-foreground text-xs">Client ID:</span>
                <span className="font-mono font-semibold text-primary text-xs tracking-tight">
                  {maskClientId(currentClientId)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
