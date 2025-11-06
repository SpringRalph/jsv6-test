"use client"

import { useEnvStore } from "@/store/useEnvStore"
import { maskClientId } from "@/lib/storage"
import Link from "next/link"

export function Navbar() {
  const { clientId } = useEnvStore()

  return (
    <nav className="border-b-2 border-border bg-card shadow-md relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-3xl group-hover:scale-110 transition-transform">💳</span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PayPal Test Framework
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {clientId && (
              <div className="text-sm bg-muted/50 px-4 py-2 rounded-full border border-border flex items-center gap-2">
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
