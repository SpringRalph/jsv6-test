"use client"

import { useEnvStore } from "@/store/useEnvStore"
import { maskClientId } from "@/lib/storage"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

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

          {/* Logo + title — items-center keeps icon and text on same axis */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/payment-area-icon/paypal-circle.svg"
              alt="PayPal"
              width={32}
              height={32}
              className="shrink-0 group-hover:scale-110 transition-transform drop-shadow-sm"
            />
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

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Live badge */}
            {isLive && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                You are now in Live
              </div>
            )}

            {/* Client ID pill */}
            {currentClientId && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5",
                  isLive
                    ? "bg-amber-100/70 border-amber-300 dark:bg-amber-900/30 dark:border-amber-700"
                    : "bg-muted/50 border-border",
                )}
              >
                {/* env badge */}
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider leading-none",
                    isLive
                      ? "bg-amber-500 text-white"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                  )}
                >
                  {isLive ? "LIVE" : "SBX"}
                </span>

                <span className="text-xs text-muted-foreground">Client ID:</span>

                <span className="font-mono text-xs font-semibold text-primary tracking-tight">
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
