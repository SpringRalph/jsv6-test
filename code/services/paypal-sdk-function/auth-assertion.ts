/**
 * Builds the PayPal-Auth-Assertion header value: an unsigned "JWT" of
 * base64({"alg":"none"}).base64({"iss":clientId,"payer_id":merchantId}).
 */
export function buildAuthAssertionHeader(clientId: string, merchantId: string): string {
    const header = "eyJhbGciOiJub25lIn0="; // base64({"alg":"none"})
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ iss: clientId, payer_id: merchantId }))));
    return `${header}.${payload}.`;
}
