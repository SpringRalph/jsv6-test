"use client"

import { useEffect, useState } from "react"
import { useCartStore } from "@/store/useCartStore"
import {
  getHostOrigin,
  isEmbedded,
  parseHostMessage,
  postToHost,
  useBridgeLog,
  type CartSnapshot,
} from "@/lib/iframeBridge"

type LinkState = "standalone" | "unknown-host" | "waiting" | "linked"

function snapshot(): CartSnapshot {
  const { product, quantity } = useCartStore.getState()
  return {
    title: product.title,
    quantity,
    unitPrice: product.price,
    total: Number((product.price * quantity).toFixed(2)),
    currency: "USD",
  }
}

export function HostLinkPanel() {
  const [link, setLink] = useState<LinkState>("waiting")
  const [hostOrigin, setHostOrigin] = useState<string | null>(null)
  const entries = useBridgeLog((s) => s.entries)
  const clear = useBridgeLog((s) => s.clear)

  useEffect(() => {
    if (!isEmbedded()) {
      setLink("standalone")
      return
    }
    const origin = getHostOrigin()
    setHostOrigin(origin)
    if (!origin) {
      setLink("unknown-host")
      return
    }

    let cause: "host" | "frame" = "frame"
    let lastQuantity = useCartStore.getState().quantity

    const onMessage = (event: MessageEvent) => {
      const msg = parseHostMessage(event)
      if (!msg) return
      useBridgeLog.getState().push({ dir: "in", type: msg.type, payload: msg.payload })
      setLink("linked")

      if (msg.type === "sync") {
        postToHost({ type: "frame:ready", payload: snapshot() })
      } else if (msg.type === "ping") {
        postToHost({ type: "pong", payload: { ts: msg.payload.ts } })
      } else if (msg.type === "cart:set-quantity") {
        const next = Math.round(Number(msg.payload.quantity))
        if (Number.isFinite(next) && next >= 1 && next <= 99) {
          cause = "host"
          useCartStore.getState().setQuantity(next)
        }
      }
    }

    const unsubscribeCart = useCartStore.subscribe((state) => {
      if (state.quantity === lastQuantity) return
      lastQuantity = state.quantity
      postToHost({ type: "cart:changed", payload: { ...snapshot(), cause } })
      cause = "frame"
    })

    window.addEventListener("message", onMessage)
    postToHost({ type: "frame:ready", payload: snapshot() })

    return () => {
      window.removeEventListener("message", onMessage)
      unsubscribeCart()
    }
  }, [])

  const status = {
    standalone: { label: "Standalone", hint: "This page is not inside an iframe, so nothing is sent." },
    "unknown-host": { label: "Host not allowed", hint: "The embedding page's origin is not on the allowlist." },
    waiting: { label: "Waiting for host", hint: "Ready messages sent. No reply from the host yet." },
    linked: { label: "Linked", hint: hostOrigin ?? "" },
  }[link]

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              link === "linked" ? "bg-green-500" : link === "waiting" ? "bg-amber-500" : "bg-gray-400"
            }`}
          />
          <span className="font-semibold">Host link: {status.label}</span>
        </div>
        <button
          type="button"
          onClick={clear}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          Clear log
        </button>
      </div>
      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{status.hint}</p>

      <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto font-mono text-xs">
        {entries.length === 0 && <li className="text-muted-foreground">No messages yet.</li>}
        {entries.map((e) => (
          <li key={e.id} className="flex gap-2 rounded-md bg-background px-2 py-1">
            <span className={e.dir === "in" ? "text-blue-600" : "text-amber-600"}>
              {e.dir === "in" ? "host → frame" : "frame → host"}
            </span>
            <span className="font-semibold">{e.type}</span>
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{JSON.stringify(e.payload)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
