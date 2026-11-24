// next-on-pages 把 Cloudflare 的 env(含 D1 绑定 DB)放在 globalThis 的这个 symbol 上,等价于 getRequestContext().env
export function getCfEnv(): Record<string, unknown> {
  const ctx = (globalThis as Record<symbol, unknown>)[Symbol.for("__cloudflare-context__")] as
    | { env?: Record<string, unknown> }
    | undefined;
  return ctx?.env ?? {};
}
