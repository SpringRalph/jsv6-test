import { buildBasicAuthHeader, getPayPalConfig } from "@/services/paypal-server-side-function/server-function";
import consola from "consola";
import { NextResponse } from "next/server";

const CACHE_TTL = 10 * 60 * 1000;
let cachedClientToken: string | null = null;
let cachedAt = 0;
let fetchingPromise: Promise<string> | null = null;

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


async function fetchClientTokenFromPayPal(): Promise<string> {
  if (fetchingPromise) return fetchingPromise;

  fetchingPromise = (async () => {
    const { clientId, clientSecret, base } = getPayPalConfig();
    const form = new URLSearchParams();
    form.append("grant_type", "client_credentials");
    // 如果你确实需要 response_type，请保留；否则基本的 client_credentials 即可
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

    // 更新缓存
    cachedClientToken = accessToken;
    cachedAt = Date.now();

    consola.debug("[/api/paypal/client-token] fetched new token and cached it");

    fetchingPromise = null;
    return accessToken;
  })();

  try {
    return await fetchingPromise;
  } catch (err) {
    // 出错时清理状态，避免永久挂起
    fetchingPromise = null;
    throw err;
  }
}

export async function GET() {
  consola.info("  --[/api/paypal/client-token]: HTTP REQUEST received");

  try {
    // 如果缓存未过期，直接返回缓存值
    if (cachedClientToken && Date.now() - cachedAt < CACHE_TTL) {
      consola.debug("[/api/paypal/client-token] returning cached token");
      return NextResponse.json({ clientToken: cachedClientToken });
    }

    // 否则去 PayPal 拉取（并在并发情况下复用同一个 promise）
    const token = await fetchClientTokenFromPayPal();
    return NextResponse.json({ clientToken: token });
  } catch (err: any) {
    consola.error("[/api/paypal/client-token] error fetching token", err);
    return NextResponse.json({ error: "internal error", details: String(err) }, { status: 500 });
  }
}