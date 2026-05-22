"use client";

import { useEnvStore } from "@/store/useEnvStore";
import { Card } from "@/components/ui/Card";
import { unloadPayPalWebSdk } from "@/lib/paypalScript";
import type { AuthMode } from "@/types/env";
import { KeyRound, Coins } from "lucide-react";

export function AuthModePanel() {
  const { authMode, setAuthMode, bumpSdkReloadToken } = useEnvStore();

  const handleModeToggle = (mode: AuthMode) => {
    if (mode === authMode) return;
    unloadPayPalWebSdk();
    setAuthMode(mode);
    bumpSdkReloadToken();
  };

  return (
    <Card className="p-6 border-2 border-purple-200 dark:border-purple-800 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl -z-10" />

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">🔌</span>
        SDK Init Mode
      </h2>

      <p className="text-sm text-muted-foreground mb-4">
        控制所有测试案例使用哪种方式初始化 PayPal SDK 实例。
      </p>

      <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => handleModeToggle("clientToken")}
          className={`flex items-center gap-2 px-4 py-1.5 transition-colors ${
            authMode === "clientToken"
              ? "bg-purple-600 text-white font-semibold"
              : "bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          <Coins className="w-4 h-4" />
          clientToken
        </button>
        <button
          type="button"
          onClick={() => handleModeToggle("clientId")}
          className={`flex items-center gap-2 px-4 py-1.5 transition-colors ${
            authMode === "clientId"
              ? "bg-purple-600 text-white font-semibold"
              : "bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          clientId
        </button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {authMode === "clientToken"
          ? "clientToken 模式：后端通过 OAuth 换取 access token，传给 createInstance()"
          : "clientId 模式：直接将 clientId 传给 createInstance()，无需后端 token 接口"}
      </p>
    </Card>
  );
}
