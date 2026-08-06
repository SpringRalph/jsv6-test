"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Card } from "@/components/ui/Card"
import { useEnvStore } from "@/store/useEnvStore"
import { getPayPalHeaders } from "@/services/paypal-sdk-function/paypal-headers"

export function ApplePayDomainPanel() {
  const integrationMode = useEnvStore((s) => s.integrationMode)
  const isPartnerMode = integrationMode === "partner"

  const [domain, setDomain] = useState("")
  const [domains, setDomains] = useState<string[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [deregisteringDomain, setDeregisteringDomain] = useState<string | null>(null)
  const [reasonByDomain, setReasonByDomain] = useState<Record<string, string>>({})

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDomain(window.location.hostname)
    }
  }, [])

  const fetchDomains = async () => {
    if (!isPartnerMode) return
    setLoadingList(true)
    try {
      const res = await fetch("/api/paypal/apple-pay/domain-registration", {
        headers: getPayPalHeaders(),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to list domains")
        return
      }
      const names: string[] = (data.domains ?? []).map((d: any) => d?.name ?? d).filter(Boolean)
      setDomains(names)
    } catch (err: any) {
      toast.error(`Failed to list domains: ${String(err)}`)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    if (isPartnerMode) {
      fetchDomains()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartnerMode])

  const registerDomain = async () => {
    if (!domain) return
    setRegistering(true)
    try {
      const res = await fetch("/api/paypal/apple-pay/domain-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getPayPalHeaders() },
        body: JSON.stringify({ domain }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to register domain")
        return
      }
      toast.success(`已注册域名: ${domain}`)
      fetchDomains()
    } catch (err: any) {
      toast.error(`Failed to register domain: ${String(err)}`)
    } finally {
      setRegistering(false)
    }
  }

  const deregisterDomain = async (name: string) => {
    setDeregisteringDomain(name)
    try {
      const res = await fetch("/api/paypal/apple-pay/domain-registration", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getPayPalHeaders() },
        body: JSON.stringify({ domain: name, reason: reasonByDomain[name] || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to deregister domain")
        return
      }
      toast.success(`已解绑域名: ${name}`)
      fetchDomains()
    } catch (err: any) {
      toast.error(`Failed to deregister domain: ${String(err)}`)
    } finally {
      setDeregisteringDomain(null)
    }
  }

  return (
    <Card className="p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 -z-10" />

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">🍎</span>
        Apple Pay Domain
      </h2>

      {!isPartnerMode && (
        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          域名注册/解绑仅在三方模式（Partner）下可用，请在 EnvPanel 中切换 Integration Mode。
        </p>
      )}

      <fieldset disabled={!isPartnerMode} className={!isPartnerMode ? "opacity-50 pointer-events-none" : undefined}>
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="flex-1 border rounded-lg px-3 py-2 bg-background"
          />
          <button
            onClick={registerDomain}
            disabled={registering || !domain}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {registering ? "注册中..." : "注册域名"}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground">已注册域名</h3>
            <button onClick={fetchDomains} className="text-xs text-blue-600 hover:underline">
              {loadingList ? "刷新中..." : "刷新"}
            </button>
          </div>

          {domains.length === 0 && !loadingList && (
            <p className="text-sm text-muted-foreground">暂无已注册域名</p>
          )}

          {domains.map((name) => (
            <div key={name} className="flex items-center gap-2 bg-muted/50 p-3 rounded-lg">
              <span className="flex-1 font-mono text-sm">{name}</span>
              <input
                type="text"
                value={reasonByDomain[name] ?? ""}
                onChange={(e) => setReasonByDomain((prev) => ({ ...prev, [name]: e.target.value }))}
                placeholder="解绑原因（可选）"
                className="w-48 border rounded-lg px-2 py-1 text-sm bg-background"
              />
              <button
                onClick={() => deregisterDomain(name)}
                disabled={deregisteringDomain === name}
                className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-50"
              >
                {deregisteringDomain === name ? "解绑中..." : "解绑"}
              </button>
            </div>
          ))}
        </div>
      </fieldset>
    </Card>
  )
}
