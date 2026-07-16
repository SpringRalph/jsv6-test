export type PayPalEnv = "sandbox" | "live"
export type AuthMode = "clientToken" | "clientId"
export type IntegrationMode = "merchant" | "partner"

export interface EnvState {
  env: PayPalEnv
  authMode: AuthMode
  integrationMode: IntegrationMode
  // sandbox credentials (1st party / merchant)
  clientId: string
  secret: string
  // live credentials (1st party / merchant)
  liveClientId: string
  liveSecret: string
  // sandbox partner credentials (3rd party)
  partnerClientId: string
  partnerSecret: string
  // live partner credentials (3rd party)
  livePartnerClientId: string
  livePartnerSecret: string
  // authorized merchant id used as payer_id in PayPal-Auth-Assertion
  authAssertionMerchantId: string
  liveAuthAssertionMerchantId: string
}