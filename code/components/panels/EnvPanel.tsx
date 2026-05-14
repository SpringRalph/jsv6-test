"use client";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

import { useState } from "react";
import { LIVE_CLIENT_ID_C2, LIVE_SECRET_C2, SANDBOX_CLIENT_ID_C2, SANDBOX_SECRET_ID_C2, useEnvStore } from "@/store/useEnvStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { VaultManagerDialog } from "@/components/panels/VaultManagerDialog";
import { CredentialCombobox, type CredentialOption } from "@/components/ui/CredentialCombobox";
import { unloadPayPalWebSdk } from "@/lib/paypalScript";
import { AlertTriangle } from "lucide-react";
import type { PayPalEnv } from "@/types/env";

const SANDBOX_CLIENT_ID_OPTIONS: CredentialOption[] = [
  {
    label: "US Acct",
    value: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
  },
  {
    label: "C2 Acct",
    value: SANDBOX_CLIENT_ID_C2,
  },
];

const SANDBOX_SECRET_OPTIONS: CredentialOption[] = [
  {
    label: "US Acct",
    value: process.env.NEXT_PUBLIC_PAYPAL_SECRET ?? "",
  },
  {
    label: "C2 Acct",
    value: SANDBOX_SECRET_ID_C2,
  },
];

const LIVE_CLIENT_ID_OPTIONS: CredentialOption[] = [
  {
    label: "Live Test Account",
    value: LIVE_CLIENT_ID_C2,
  },
];

const LIVE_SECRET_OPTIONS: CredentialOption[] = [
  {
    label: "Live Test Account",
    value: LIVE_SECRET_C2,
  },
];

export function EnvPanel() {
  const {
    env,
    clientId,
    secret,
    liveClientId,
    liveSecret,
    setEnv,
    setClientId,
    setSecret,
    setLiveClientId,
    setLiveSecret,
    reset,
  } = useEnvStore();

  const isSandbox = env === "sandbox";

  const [localClientId, setLocalClientId] = useState(clientId);
  const [localSecret, setLocalSecret] = useState(secret);
  const [localLiveClientId, setLocalLiveClientId] = useState(liveClientId);
  const [localLiveSecret, setLocalLiveSecret] = useState(liveSecret);
  const [saved, setSaved] = useState(false);
  const [showLiveConfirm, setShowLiveConfirm] = useState(false);

  const activeLocalClientId = isSandbox ? localClientId : localLiveClientId;
  const activeLocalSecret = isSandbox ? localSecret : localLiveSecret;
  const setActiveLocalClientId = isSandbox ? setLocalClientId : setLocalLiveClientId;
  const setActiveLocalSecret = isSandbox ? setLocalSecret : setLocalLiveSecret;

  const handleEnvToggle = (newEnv: PayPalEnv) => {
    if (newEnv === env) return;
    if (newEnv === "live") {
      setShowLiveConfirm(true);
      return;
    }
    unloadPayPalWebSdk();
    setEnv(newEnv);
  };

  const confirmSwitchToLive = () => {
    setShowLiveConfirm(false);
    unloadPayPalWebSdk();
    setEnv("live");
  };

  const handleSave = () => {
    const prevClientId = isSandbox ? clientId : liveClientId;
    const prevSecret = isSandbox ? secret : liveSecret;
    const changed =
      activeLocalClientId !== prevClientId ||
      activeLocalSecret !== prevSecret;

    if (isSandbox) {
      setClientId(localClientId);
      setSecret(localSecret);
    } else {
      setLiveClientId(localLiveClientId);
      setLiveSecret(localLiveSecret);
    }

    if (changed) {
      unloadPayPalWebSdk();
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    reset();
    setLocalClientId(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "");
    setLocalSecret(process.env.NEXT_PUBLIC_PAYPAL_SECRET ?? "");
    setLocalLiveClientId("AZXvmryZOBQvyeBosxJoMsNbNCYVNGWx5KyArJPYz2O2sEGAOla9s6cI40RVFXHg9oEInNzyQIKzI6tW");
    setLocalLiveSecret("EAx19qrwczQSJeSzQ5FjlzAUAjgd7LJcneDH9k93ZocGWaF4k_oYcX1k8-AvSrJkMvdlncdIUYZSxtf0");
    unloadPayPalWebSdk();
  };

  const clientIdOptions = isSandbox ? SANDBOX_CLIENT_ID_OPTIONS : LIVE_CLIENT_ID_OPTIONS;
  const secretOptions = isSandbox ? SANDBOX_SECRET_OPTIONS : LIVE_SECRET_OPTIONS;

  return (
    <>
    <Card className="p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl -z-10" />

      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="text-2xl">⚙️</span>
        Environment Configuration
      </h2>

      {/* Environment toggle */}
      <div className="mb-5">
        <p className="text-sm font-medium mb-2">Environment</p>
        <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => handleEnvToggle("sandbox")}
            className={`px-4 py-1.5 transition-colors ${
              isSandbox
                ? "bg-blue-600 text-white font-semibold"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Sandbox
          </button>
          <button
            type="button"
            onClick={() => handleEnvToggle("live")}
            className={`px-4 py-1.5 transition-colors ${
              !isSandbox
                ? "bg-green-600 text-white font-semibold"
                : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Live
          </button>
        </div>
        {!isSandbox && (
          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
            ⚠️ Live environment — real transactions may occur
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium mb-2 flex items-center gap-2">
            <span className="text-lg">🔑</span>
            PayPal Client ID
          </label>
          <CredentialCombobox
            value={activeLocalClientId}
            onChange={setActiveLocalClientId}
            options={clientIdOptions}
            placeholder="Select or enter Client ID"
            inputType="text"
          />
        </div>

        <div>
          <label htmlFor="secret" className="block text-sm font-medium mb-2 flex items-center gap-2">
            <span className="text-lg">🔐</span>
            PayPal Secret
          </label>
          <CredentialCombobox
            value={activeLocalSecret}
            onChange={setActiveLocalSecret}
            options={secretOptions}
            placeholder="Select or enter Secret"
            inputType="password"
          />
        </div>

        <div className="flex items-center flex-wrap gap-3">
          <Button
            onClick={handleSave}
            className="shadow-md hover:shadow-lg transition-shadow"
          >
            💾 Save Configuration
          </Button>
          <Button
            onClick={handleReset}
            variant="secondary"
            className="shadow-md hover:shadow-lg transition-shadow"
          >
            🔄 Reset
          </Button>
          <VaultManagerDialog />
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
              ✅ Saved — SDK reloading
            </span>
          )}
        </div>
      </div>
    </Card>
      {/* Live environment confirmation dialog */}
      <AlertDialog.Root open={showLiveConfirm} onOpenChange={setShowLiveConfirm}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-amber-200 bg-white p-6 shadow-2xl dark:border-amber-800 dark:bg-zinc-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40"><AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" strokeWidth={2} /></span>
              <AlertDialog.Title className="text-lg font-semibold text-amber-800 dark:text-amber-300">
                Switch to Live Environment
              </AlertDialog.Title>
            </div>
            <AlertDialog.Description className="mb-6 text-sm text-muted-foreground leading-relaxed">
              You are now in <span className="font-semibold text-amber-700 dark:text-amber-400">Live Environment</span>. Some features behavior would be different because of the scope of your account!
            </AlertDialog.Description>
            <div className="flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={confirmSwitchToLive}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
                >
                  I understand, switch to Live
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
