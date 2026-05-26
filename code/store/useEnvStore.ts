'use client';

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { EnvState, PayPalEnv, AuthMode } from "@/types/env"

interface EnvStore extends EnvState {
  setEnv: (env: PayPalEnv) => void
  setAuthMode: (mode: AuthMode) => void
  setClientId: (clientId: string) => void
  setSecret: (secret: string) => void
  setLiveClientId: (clientId: string) => void
  setLiveSecret: (secret: string) => void
  reset: () => void
  // returns active credentials based on current env
  activeClientId: () => string
  activeSecret: () => string
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


const envDefaults: EnvState = {
  env: "sandbox",
  authMode: "clientToken",
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
  secret: process.env.NEXT_PUBLIC_PAYPAL_SECRET ?? "",
  liveClientId: LIVE_CLIENT_ID_C2,
  liveSecret: LIVE_SECRET_C2,
}

export const useEnvStore = create<EnvStore>()(
  persist(
    (set, get) => ({
      ...envDefaults,
      setEnv: (env) => set({ env }),
      setAuthMode: (authMode) => set({ authMode }),
      setClientId: (clientId) => set({ clientId }),
      setSecret: (secret) => set({ secret }),
      setLiveClientId: (liveClientId) => set({ liveClientId }),
      setLiveSecret: (liveSecret) => set({ liveSecret }),
      reset: () => set(envDefaults),
      activeClientId: () => get().env === "live" ? get().liveClientId : get().clientId,
      activeSecret: () => get().env === "live" ? get().liveSecret : get().secret,
      sdkReloadToken: 0,
      bumpSdkReloadToken: () => set((s) => ({ sdkReloadToken: s.sdkReloadToken + 1 })),
    }),
    {
      name: "pp-v6-env",
    },
  ),
)
