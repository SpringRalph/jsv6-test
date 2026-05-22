import { useEnvStore } from "@/store/useEnvStore";
import { getBrowserSafeClientToken } from "@/services/paypal-sdk-function/browser-function";

export function useSdkInitOptions() {
  const authMode = useEnvStore((s) => s.authMode);
  const activeClientId = useEnvStore((s) => s.activeClientId());

  async function getInitOptions(): Promise<{ clientToken: string } | { clientId: string }> {
    if (authMode === "clientId") {
      return { clientId: activeClientId };
    }
    const clientToken = await getBrowserSafeClientToken();
    return { clientToken };
  }

  return { getInitOptions, authMode };
}
