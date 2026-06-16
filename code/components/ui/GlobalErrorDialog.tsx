"use client";

import { useState } from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) hide();
      }}
    >
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span>{title || "Error"}</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="break-words text-foreground">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>

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

        <AlertDialogFooter>
          <AlertDialogAction onClick={hide}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
