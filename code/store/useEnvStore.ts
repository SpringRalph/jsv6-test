'use client';

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { EnvState } from "@/types/env"

interface EnvStore extends EnvState {
  setClientId: (clientId: string) => void
  setSecret: (secret: string) => void
  reset: () => void
}

// 从 .env 读取默认值（Next.js 前缀必须为 NEXT_PUBLIC_）
const envDefaults: EnvState = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
  secret: process.env.NEXT_PUBLIC_PAYPAL_SECRET ?? "",
}

const initialState: EnvState = {
  ...envDefaults,
}

export const useEnvStore = create<EnvStore>()(
  persist(
    (set) => ({
      ...initialState,
      setClientId: (clientId) => set({ clientId }),
      setSecret: (secret) => set({ secret }),
      // 重置为 .env 默认值
      reset: () => set(envDefaults),
    }),
    {
      name: "pp-v6-env",
    },
  ),
)