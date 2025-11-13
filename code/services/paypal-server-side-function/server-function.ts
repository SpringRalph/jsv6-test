export type PayPalEnv = "sandbox" | "production";

export function getPayPalConfig() {
    // 优先使用服务端环境变量（不要暴露 secret 到前端）
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    const clientSecret = process.env.NEXT_PUBLIC_PAYPAL_SECRET
    const env = ((process.env.PAYPAL_ENV ?? "sandbox") as string).toLowerCase() as PayPalEnv;

    // console.log("clientId:",clientId)
    // console.log("Secret:",clientSecret)
    // console.log("env:",env)

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