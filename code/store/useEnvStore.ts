'use client';

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { EnvState, PayPalEnv, AuthMode, IntegrationMode } from "@/types/env"

interface EnvStore extends EnvState {
  setEnv: (env: PayPalEnv) => void
  setAuthMode: (mode: AuthMode) => void
  setIntegrationMode: (mode: IntegrationMode) => void
  setClientId: (clientId: string) => void
  setSecret: (secret: string) => void
  setLiveClientId: (clientId: string) => void
  setLiveSecret: (secret: string) => void
  setPartnerClientId: (clientId: string) => void
  setPartnerSecret: (secret: string) => void
  setLivePartnerClientId: (clientId: string) => void
  setLivePartnerSecret: (secret: string) => void
  setAuthAssertionMerchantId: (merchantId: string) => void
  setLiveAuthAssertionMerchantId: (merchantId: string) => void
  reset: () => void
  // returns active credentials based on current env + integration mode
  activeClientId: () => string
  activeSecret: () => string
  activeAuthAssertionMerchantId: () => string
  sdkReloadToken: number
  bumpSdkReloadToken: () => void
}

export const LIVE_CLIENT_ID_C2 = "AZXvmryZOBQvyeBosxJoMsNbNCYVNGWx5KyArJPYz2O2sEGAOla9s6cI40RVFXHg9oEInNzyQIKzI6tW"
export const LIVE_SECRET_C2 = "EAx19qrwczQSJeSzQ5FjlzAUAjgd7LJcneDH9k93ZocGWaF4k_oYcX1k8-AvSrJkMvdlncdIUYZSxtf0"


/**
 * Application Name: C2-JSv6 Test APP
 * Email Id: p-test-cn-v6-2025@test.com
 * Account Number: 5314333912581353572
 * pwd: Qq111222333
 */

export const SANDBOX_CLIENT_ID_C2 = "ATW2maVlMXBh67xRprsLYttNFXVCDO7MhEUE_VId1zbwqSSfYfIAC8mtdLaLRwA4nZpTzGBZPws7Kf-Z";
export const SANDBOX_SECRET_ID_C2 = "ELYFWy2PauSftn1lFaTkqsUd2sDu_gPrOi3cGOGj_6JyORnlG46cp16oBnLLmpBBQuhxQIKIiOIwCu_D";

/**
 * partner js v6 sandbox credentials
 * email: p-test-cn-v6-2026-partner@test.com
 * payer-id: PVQS4XCWAMC72
 */
export const SANDBOX_CLIENT_ID_C2_PARTNER = "AePs-yrCXVsSOXgyI366Of0nlHm4siQdYBTKmQHSOwAaelbWFi836og7nc1y-gKZxROWTNFSV1l7oELW"
export const SANDBOX_SECRET_ID_C2_PARTNER = "EAvQRspHg3Z5ID5q8u0NY5PmmXVHNJFpEQpqjIoqhUe5iwWQNnZTMpYDSP9LVz_TEwDn7midKulLkRZ4"

/**
 * US merchant, same with 1st US acct
 * email: p-test-us-v6-2025@test.com
 * pwd: 111222333
 */
export const SANDBOX_PARTNER_MERCHANT_ID_C2 = "S6F9D8L9KLQJA"

const envDefaults: EnvState = {
  env: "sandbox",
  authMode: "clientToken",
  integrationMode: "merchant",
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
  secret: process.env.NEXT_PUBLIC_PAYPAL_SECRET ?? "",
  liveClientId: LIVE_CLIENT_ID_C2,
  liveSecret: LIVE_SECRET_C2,
  partnerClientId: SANDBOX_CLIENT_ID_C2_PARTNER,
  partnerSecret: SANDBOX_SECRET_ID_C2_PARTNER,
  livePartnerClientId: "",
  livePartnerSecret: "",
  authAssertionMerchantId: SANDBOX_PARTNER_MERCHANT_ID_C2,
  liveAuthAssertionMerchantId: "",
}

export const useEnvStore = create<EnvStore>()(
  persist(
    (set, get) => ({
      ...envDefaults,
      setEnv: (env) => set({ env }),
      setAuthMode: (authMode) => set({ authMode }),
      setIntegrationMode: (integrationMode) => set({ integrationMode }),
      setClientId: (clientId) => set({ clientId }),
      setSecret: (secret) => set({ secret }),
      setLiveClientId: (liveClientId) => set({ liveClientId }),
      setLiveSecret: (liveSecret) => set({ liveSecret }),
      setPartnerClientId: (partnerClientId) => set({ partnerClientId }),
      setPartnerSecret: (partnerSecret) => set({ partnerSecret }),
      setLivePartnerClientId: (livePartnerClientId) => set({ livePartnerClientId }),
      setLivePartnerSecret: (livePartnerSecret) => set({ livePartnerSecret }),
      setAuthAssertionMerchantId: (authAssertionMerchantId) => set({ authAssertionMerchantId }),
      setLiveAuthAssertionMerchantId: (liveAuthAssertionMerchantId) => set({ liveAuthAssertionMerchantId }),
      reset: () => set(envDefaults),
      activeClientId: () => {
        const s = get()
        if (s.integrationMode === "partner") {
          return s.env === "live" ? s.livePartnerClientId : s.partnerClientId
        }
        return s.env === "live" ? s.liveClientId : s.clientId
      },
      activeSecret: () => {
        const s = get()
        if (s.integrationMode === "partner") {
          return s.env === "live" ? s.livePartnerSecret : s.partnerSecret
        }
        return s.env === "live" ? s.liveSecret : s.secret
      },
      activeAuthAssertionMerchantId: () => {
        const s = get()
        return s.env === "live" ? s.liveAuthAssertionMerchantId : s.authAssertionMerchantId
      },
      sdkReloadToken: 0,
      bumpSdkReloadToken: () => set((s) => ({ sdkReloadToken: s.sdkReloadToken + 1 })),
    }),
    {
      name: "pp-v6-env",
    },
  ),
)
