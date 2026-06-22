export type PayPalEnv = "sandbox" | "live"
export type AuthMode = "clientToken" | "clientId"

export interface EnvState {
  env: PayPalEnv
  authMode: AuthMode
  // sandbox credentials
  clientId: string
  secret: string
  // live credentials
  liveClientId: string
  liveSecret: string
}