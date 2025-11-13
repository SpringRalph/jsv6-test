"use client";

import { useEffect, useState } from "react";
import { loadPayPalWebSdk, isPayPalWebSdkLoaded } from "@/lib/paypalScript";

export enum PAYPALSDKURL {
  SANDBOX_SRC = "SANDBOX",
  PRODUCTION_SRC = "PRODUCTION"
}

export function usePayPalWebSdk(srcType: PAYPALSDKURL = PAYPALSDKURL.SANDBOX_SRC) {
  const [ready, setReady] = useState(isPayPalWebSdkLoaded());
  const [loading, setLoading] = useState(!isPayPalWebSdkLoaded());
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadPayPalWebSdk(srcType)
      .then(() => {
        if (!cancelled) {
          setReady(true);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [srcType]);

  return { ready, loading, error };
}