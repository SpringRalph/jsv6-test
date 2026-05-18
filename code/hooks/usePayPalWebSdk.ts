import { useEffect, useState } from "react";
import { loadPayPalWebSdk, isPayPalWebSdkLoaded, PAYPALSDKURL } from "@/lib/paypalScript";
import { useEnvStore } from "@/store/useEnvStore";

export { PAYPALSDKURL };

export function usePayPalWebSdk(srcType?: PAYPALSDKURL) {
  const env = useEnvStore((state) => state.env);
  const sdkReloadToken = useEnvStore((state) => state.sdkReloadToken);

  // If caller doesn't specify, derive from store env
  const resolvedSrcType = srcType ?? (env === "live" ? PAYPALSDKURL.PRODUCTION_SRC : PAYPALSDKURL.SANDBOX_SRC);

  const [ready, setReady] = useState(isPayPalWebSdkLoaded());
  const [loading, setLoading] = useState(!isPayPalWebSdkLoaded());
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setLoading(true);
    setError(null);

    loadPayPalWebSdk(resolvedSrcType)
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
  }, [resolvedSrcType, sdkReloadToken]);

  return { ready, loading, error };
}
