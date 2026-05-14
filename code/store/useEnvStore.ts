'use client';

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { EnvState, PayPalEnv } from "@/types/env"

interface EnvStore extends EnvState {
  setEnv: (env: PayPalEnv) => void
  setClientId: (clientId: string) => void
  setSecret: (secret: string) => void
  setLiveClientId: (clientId: string) => void
  setLiveSecret: (secret: string) => void
  reset: () => void
  // returns active credentials based on current env
  activeClientId: () => string
  activeSecret: () => string
}

const LIVE_CLIENT_ID = "AZXvmryZOBQvyeBosxJoMsNbNCYVNGWx5KyArJPYz2O2sEGAOla9s6cI40RVFXHg9oEInNzyQIKzI6tW"
const LIVE_SECRET = "EAx19qrwczQSJeSzQ5FjlzAUAjgd7LJcneDH9k93ZocGWaF4k_oYcX1k8-AvSrJkMvdlncdIUYZSxtf0"

const envDefaults: EnvState = {
  env: "sandbox",
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
  secret: process.env.NEXT_PUBLIC_PAYPAL_SECRET ?? "",
  liveClientId: LIVE_CLIENT_ID,
  liveSecret: LIVE_SECRET,
}

export const useEnvStore = create<EnvStore>()(
  persist(
    (set, get) => ({
      ...envDefaults,
      setEnv: (env) => set({ env }),
      setClientId: (clientId) => set({ clientId }),
      setSecret: (secret) => set({ secret }),
      setLiveClientId: (liveClientId) => set({ liveClientId }),
      setLiveSecret: (liveSecret) => set({ liveSecret }),
      reset: () => set(envDefaults),
      activeClientId: () => get().env === "live" ? get().liveClientId : get().clientId,
      activeSecret: () => get().env === "live" ? get().liveSecret : get().secret,
    }),
    {
      name: "pp-v6-env",
    },
  ),
)
