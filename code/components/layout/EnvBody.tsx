"use client";

import { useEnvStore } from "@/store/useEnvStore";
import { cn } from "@/lib/utils";

export function EnvBody({ children }: { children: React.ReactNode }) {
  const isLive = useEnvStore((s) => s.env === "live");

  return (
    <body
      className={cn(
        "transition-colors duration-500",
        isLive
          ? "bg-amber-50/60 dark:bg-amber-950/20"
          : "bg-background",
      )}
    >
      {children}
    </body>
  );
}
