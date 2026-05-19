export type PayPalEnv = "sandbox" | "live"

export interface EnvState {
  env: PayPalEnv
  // sandbox credentials
  clientId: string
  secret: string
  // live credentials
  liveClientId: string
  liveSecret: string
}
