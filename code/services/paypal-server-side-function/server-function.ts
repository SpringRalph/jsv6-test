export type PayPalEnv = "sandbox" | "production";

interface PayPalConfigOverride {
  clientId?: string
  clientSecret?: string
  env?: string
}

export function getPayPalConfig(override?: PayPalConfigOverride) {
    const clientId = override?.clientId || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    const clientSecret = override?.clientSecret || process.env.NEXT_PUBLIC_PAYPAL_SECRET
    const envRaw = override?.env || process.env.PAYPAL_ENV || "sandbox"
    const env = envRaw.toLowerCase() as PayPalEnv;

    if (!clientId || !clientSecret) {
        throw new Error("Missing PayPal credentials: set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET");
    }

    const base =
        env === "production" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

    return { clientId, clientSecret, env, base };
}

export function buildBasicAuthHeader(clientId: string, clientSecret: string) {
    return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}
export function getPayPalConfigFromRequest(req: Request) {
    const h = req.headers;
    const overrideClientId = h.get("x-paypal-client-id") || undefined;
    const overrideSecret = h.get("x-paypal-secret") || undefined;
    const overrideEnvRaw = h.get("x-paypal-env") || undefined;
    const overrideEnv = overrideEnvRaw === "live" ? "production" : overrideEnvRaw;
    return getPayPalConfig({ clientId: overrideClientId, clientSecret: overrideSecret, env: overrideEnv });
}
