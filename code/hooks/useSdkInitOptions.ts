import { useEnvStore } from "@/store/useEnvStore";
import { getBrowserSafeClientToken } from "@/services/paypal-sdk-function/browser-function";

export function useSdkInitOptions() {
  const authMode = useEnvStore((s) => s.authMode);
  const integrationMode = useEnvStore((s) => s.integrationMode);
  const activeClientId = useEnvStore((s) => s.activeClientId());
  const activeAuthAssertionMerchantId = useEnvStore((s) => s.activeAuthAssertionMerchantId());

  async function getInitOptions(): Promise<
    { clientToken: string } | { clientId: string; merchantId?: string }
  > {
    if (authMode === "clientId") {
      if (integrationMode === "partner" && activeAuthAssertionMerchantId) {
        return { clientId: activeClientId, merchantId: activeAuthAssertionMerchantId };
      }
      return { clientId: activeClientId };
    }
    const clientToken = await getBrowserSafeClientToken();
    return { clientToken };
  }

  return { getInitOptions, authMode };
}
