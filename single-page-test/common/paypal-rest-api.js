// 直接对 PayPal REST API 发请求，不经过任何后端代理。用于各测试页里 create-order / capture 的场景。
export const PAYPAL_API_BASE_SANDBOX = "https://api-m.sandbox.paypal.com";
export const PAYPAL_API_BASE_LIVE = "https://api-m.paypal.com";

const accessTokenCache = {};

export async function getAccessToken(
    account,
    { apiBase = PAYPAL_API_BASE_SANDBOX, log } = {}
) {
    const cacheKey = `${apiBase}:${account.clientId}`;
    if (accessTokenCache[cacheKey]) return accessTokenCache[cacheKey];

    const basicAuth = btoa(`${account.clientId}:${account.secret}`);
    const res = await fetch(`${apiBase}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
        log?.(`[oauth] 获取 access token 失败 (HTTP ${res.status})`, json, "error");
        throw new Error(`获取 access token 失败: ${res.status}`);
    }
    log?.("[oauth] access token 获取成功", { expires_in: json.expires_in });
    accessTokenCache[cacheKey] = json.access_token;
    return json.access_token;
}

export async function createOrder(
    account,
    body,
    { apiBase = PAYPAL_API_BASE_SANDBOX, headers = {}, log } = {}
) {
    const accessToken = await getAccessToken(account, { apiBase, log });
    log?.("[create-order] 请求体", body);
    if (headers["PayPal-Auth-Assertion"]) {
        log?.(
            "[create-order] 附加 paypal-auth-assertion header",
            headers["PayPal-Auth-Assertion"]
        );
    }

    const res = await fetch(`${apiBase}/v2/checkout/orders`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...headers,
        },
        body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
        log?.(
            `[create-order] 失败 (HTTP ${res.status})`,
            json ?? (await res.text().catch(() => "")),
            "error"
        );
        throw new Error(`create-order 失败: ${res.status}`);
    }

    log?.("[create-order] 成功", json, "success");
    const orderId = json?.id;
    if (!orderId) throw new Error("PayPal 未返回订单 ID");
    return { orderId, raw: json };
}

export async function captureOrder(
    account,
    orderId,
    { apiBase = PAYPAL_API_BASE_SANDBOX, headers = {}, log } = {}
) {
    const accessToken = await getAccessToken(account, { apiBase, log });
    const res = await fetch(`${apiBase}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...headers,
        },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
        log?.(
            `[capture] 失败 (HTTP ${res.status})`,
            json ?? (await res.text().catch(() => "")),
            "error"
        );
        throw new Error(`capture 失败: ${res.status}`);
    }
    return json;
}
