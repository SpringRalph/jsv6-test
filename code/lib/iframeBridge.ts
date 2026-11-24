import { create } from "zustand"

export const BRIDGE_SOURCE = "jsv6-test"
export const BRIDGE_VERSION = 1

export interface CartSnapshot {
  title: string
  quantity: number
  unitPrice: number
  total: number
  currency: string
}

export interface PaymentReceipt {
  orderId: string
  txnId: string
  status: string
  amount: string
  currency: string
}

export type HostToFrame =
  | { type: "sync"; payload: Record<string, never> }
  | { type: "ping"; payload: { ts: number } }
  | { type: "cart:set-quantity"; payload: { quantity: number } }

export type FrameToHost =
  | { type: "frame:ready"; payload: CartSnapshot }
  | { type: "pong"; payload: { ts: number } }
  | { type: "cart:changed"; payload: CartSnapshot & { cause: "host" | "frame" } }
  | { type: "payment:start"; payload: { quantity: number; total: number } }
  | { type: "payment:approved"; payload: PaymentReceipt }
  | { type: "payment:cancelled"; payload: { orderId?: string } }
  | { type: "payment:error"; payload: { message: string } }

export const HOST_TO_FRAME_TYPES = ["sync", "ping", "cart:set-quantity"] as const

const ALLOWED_HOST_ORIGINS: RegExp[] = [
  /^https:\/\/ppgms-test\.github\.io$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
]

export function isAllowedHostOrigin(origin: string | null | undefined): origin is string {
  return !!origin && ALLOWED_HOST_ORIGINS.some((re) => re.test(origin))
}

export function isEmbedded(): boolean {
  return typeof window !== "undefined" && window.parent !== window
}

export function getHostOrigin(): string | null {
  if (!isEmbedded()) return null
  const ancestor = (window.location as Location & { ancestorOrigins?: DOMStringList }).ancestorOrigins?.[0]
  if (isAllowedHostOrigin(ancestor)) return ancestor
  try {
    const referrerOrigin = document.referrer ? new URL(document.referrer).origin : null
    if (isAllowedHostOrigin(referrerOrigin)) return referrerOrigin
  } catch {}
  return null
}

export interface LogEntry {
  id: number
  dir: "in" | "out"
  type: string
  payload: unknown
  at: number
}

interface BridgeLogStore {
  entries: LogEntry[]
  push: (entry: Omit<LogEntry, "id" | "at">) => void
  clear: () => void
}

let seq = 0
const MAX_ENTRIES = 40

export const useBridgeLog = create<BridgeLogStore>((set) => ({
  entries: [],
  push: (entry) =>
    set((s) => ({
      entries: [{ ...entry, id: ++seq, at: Date.now() }, ...s.entries].slice(0, MAX_ENTRIES),
    })),
  clear: () => set({ entries: [] }),
}))

export function postToHost<T extends FrameToHost>(message: T): boolean {
  const origin = getHostOrigin()
  if (!origin) return false
  window.parent.postMessage(
    { source: BRIDGE_SOURCE, version: BRIDGE_VERSION, ts: Date.now(), ...message },
    origin,
  )
  useBridgeLog.getState().push({ dir: "out", type: message.type, payload: message.payload })
  return true
}

export function parseHostMessage(event: MessageEvent): HostToFrame | null {
  const hostOrigin = getHostOrigin()
  if (!hostOrigin || event.origin !== hostOrigin || event.source !== window.parent) return null
  const data = event.data as { source?: string; version?: number; type?: string; payload?: unknown } | null
  if (!data || data.source !== BRIDGE_SOURCE || data.version !== BRIDGE_VERSION) return null
  if (!(HOST_TO_FRAME_TYPES as readonly string[]).includes(data.type ?? "")) return null
  return { type: data.type, payload: data.payload ?? {} } as HostToFrame
}
