/**
 * Storage utilities and constants
 */

export const STORAGE_KEYS = {
  ENV: "pp-v6-env",
  CART: "pp-v6-cart",
} as const

/**
 * Mask client ID for display (show first 6 and last 4 characters)
 */
export function maskClientId(clientId: string): string {
  if (!clientId || clientId.length < 10) {
    return clientId
  }

  const start = clientId.slice(0, 6)
  const end = clientId.slice(-4)
  return `${start}...${end}`
}
