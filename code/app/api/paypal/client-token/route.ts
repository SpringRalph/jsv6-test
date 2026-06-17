import { buildBasicAuthHeader, getPayPalConfig } from "@/services/paypal-server-side-function/server-function";
import consola from "consola";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

const CACHE_TTL = 10 * 60 * 1000;

interface CacheEntry {
  token: string
  cachedAt: number
  fetchingPromise: Promise<string> | null
}

// Cache keyed by "clientId::env" to support multiple credential sets
const tokenCache = new Map<string, CacheEntry>();

function getCacheKey(clientId: string, env: string): string {
  return `${clientId}::${env}`;
}

// export async function GET() {
//     console.log("  --[/api/paypal/client-token]: HTTP REQUEST received")
//     const { clientId, clientSecret, base } = getPayPalConfig();

//     const form = new URLSearchParams();
//     form.append("grant_type", "client_credentials");
//     form.append("response_type", "client_token")

//     try {
//         const auth = buildBasicAuthHeader(clientId, clientSecret);
//         const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
//             method: "POST",
//             headers: {
//                 Authorization: auth,
//                 "Content-Type": "application/x-www-form-urlencoded",
//             },
//             body: form.toString()
//         });

//         if (!tokenRes.ok) {
//             const text = await tokenRes.text();
//             return NextResponse.json({ error: "failed to obtain access token", details: text }, { status: 502 });
//         }

//         const tokenJson = await tokenRes.json();
//         const accessToken = tokenJson.access_token;
//         if (!accessToken) return NextResponse.json({ error: "no access token returned" }, { status: 502 });

//         consola.log("[/api/paypal/client-token]: access_token:", accessToken)
//         return NextResponse.json({ clientToken: accessToken });

//     } catch (err: any) {

//         return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
//     }
// }


async function fetchClientTokenFromPayPal(
  clientId: string,
  clientSecret: string,
  env: string,
  base: string,
  cacheKey: string,
): Promise<string> {
  const entry = tokenCache.get(cacheKey);
  if (entry?.fetchingPromise) return entry.fetchingPromise;

  const fetchingPromise = (async () => {
    const form = new URLSearchParams();
    form.append("grant_type", "client_credentials");
    form.append("response_type", "client_token");

    const auth = buildBasicAuthHeader(clientId, clientSecret);
    const tokenRes = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text().catch(() => "");
      throw new Error(`failed to obtain access token: ${tokenRes.status} ${text}`);
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) throw new Error("no access token returned from PayPal");

    tokenCache.set(cacheKey, { token: accessToken, cachedAt: Date.now(), fetchingPromise: null });
    consola.debug("[/api/paypal/client-token] fetched new token, env:", env);
    return accessToken;
  })();

  tokenCache.set(cacheKey, { token: "", cachedAt: 0, fetchingPromise });

  try {
    return await fetchingPromise;
  } catch (err) {
    tokenCache.delete(cacheKey);
    throw err;
  }
}

export async function GET(req: NextRequest) {
  consola.info("  --[/api/paypal/client-token]: HTTP REQUEST received");

  try {
    const overrideClientId = req.headers.get("x-paypal-client-id") || undefined;
    const overrideSecret = req.headers.get("x-paypal-secret") || undefined;
    // store uses "sandbox" | "live"; map "live" → "production" for PayPal API
    const overrideEnvRaw = req.headers.get("x-paypal-env") || undefined;
    const overrideEnv = overrideEnvRaw === "live" ? "production" : overrideEnvRaw;

    const { clientId, clientSecret, env, base } = getPayPalConfig({
      clientId: overrideClientId,
      clientSecret: overrideSecret,
      env: overrideEnv,
    });

    const cacheKey = getCacheKey(clientId, env);
    const entry = tokenCache.get(cacheKey);

    if (entry && !entry.fetchingPromise && entry.token && Date.now() - entry.cachedAt < CACHE_TTL) {
      consola.debug("[/api/paypal/client-token] returning cached token for env:", env);
      return NextResponse.json({ clientToken: entry.token });
    }

    const token = await fetchClientTokenFromPayPal(clientId, clientSecret, env, base, cacheKey);
    return NextResponse.json({ clientToken: token });
  } catch (err: any) {
    consola.error("[/api/paypal/client-token] error fetching token", err);
    return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
  }
}

export async function DELETE() {
  const size = tokenCache.size;
  tokenCache.clear();
  consola.info(`[/api/paypal/client-token] cache cleared (${size} entries)`);
  return new NextResponse(null, { status: 204 });
}