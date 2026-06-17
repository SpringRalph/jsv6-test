"use client";

import { useEnvStore } from "@/store/useEnvStore";
import { unloadPayPalWebSdk } from "@/lib/paypalScript";
import consola from "consola";

/**
 * 任何会影响 SDK 初始化输入的设置变更（env / clientId / secret / authMode）
 * 都应该调用本 hook 返回的 applySettingsChange()。
 *
 * 三步：
 *   1. DELETE /api/paypal/client-token — 清后端 OAuth token cache
 *   2. unloadPayPalWebSdk()            — 清 window.paypal & <script>
 *   3. bumpSdkReloadToken()            — 触发 usePayPalWebSdk 重载，
 *                                        进而让所有场景组件 [ready] 依赖重跑 createInstance
 */
export function useSettingsChange() {
  const bumpSdkReloadToken = useEnvStore((s) => s.bumpSdkReloadToken);

  return async function applySettingsChange() {
    try {
      const res = await fetch("/api/paypal/client-token", { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        consola.warn(
          `[applySettingsChange] DELETE returned ${res.status}; client cache 仍会刷新`,
        );
      }
    } catch (e) {
      consola.warn("[applySettingsChange] DELETE 网络失败，client cache 仍会刷新", e);
      // 后端清不到不阻塞前端：TTL 10min 是兜底
    }
    unloadPayPalWebSdk();
    bumpSdkReloadToken();
  };
}
