"use client";

import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AlertTriangle, Copy, Check } from "lucide-react";
import { useErrorDialogStore } from "@/store/useErrorDialogStore";

function serializeDetails(details: unknown): string {
  if (details === undefined || details === null) return "";
  if (details instanceof Error) {
    const obj: Record<string, unknown> = {
      name: details.name,
      message: details.message,
      stack: details.stack,
    };
    for (const key of Object.keys(details)) {
      (obj as any)[key] = (details as any)[key];
    }
    return JSON.stringify(obj, null, 2);
  }
  if (typeof details === "string") return details;
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

export function GlobalErrorDialog() {
  const open = useErrorDialogStore((s) => s.open);
  const title = useErrorDialogStore((s) => s.title);
  const message = useErrorDialogStore((s) => s.message);
  const details = useErrorDialogStore((s) => s.details);
  const hide = useErrorDialogStore((s) => s.hide);

  const [copied, setCopied] = useState(false);

  const detailsString = serializeDetails(details);
  const hasDetails = detailsString.length > 0;

  const handleCopy = async () => {
    if (!detailsString) return;
    try {
      await navigator.clipboard.writeText(detailsString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板权限被拒绝时静默；用户仍可手动选中复制
    }
  };

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) hide();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-background p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <AlertDialog.Title className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span>{title || "Error"}</span>
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-foreground break-words">
            {message}
          </AlertDialog.Description>

          {hasDetails && (
            <details open className="rounded-md border border-border bg-muted/40">
              <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm font-medium select-none">
                <span>Details</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs hover:bg-muted transition-colors"
                  aria-label="Copy details"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </summary>
              <pre className="max-h-[60vh] overflow-auto border-t border-border bg-background p-3 text-xs font-mono whitespace-pre-wrap break-all">
                {detailsString}
              </pre>
            </details>
          )}

          <div className="flex justify-end">
            <AlertDialog.Action
              onClick={hide}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Close
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
