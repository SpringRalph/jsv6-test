import { useEffect, useState } from "react";
import { loadScript, isScriptLoaded, getScriptSrc, unloadScript, ScriptLoadOptions } from "@/lib/scriptLoader";

export function useCustomScript(
  src: string,
  options: ScriptLoadOptions = {}
) {
  const [ready, setReady] = useState(isScriptLoaded(src));
  const [loading, setLoading] = useState(!isScriptLoaded(src));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) {
      setReady(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadScript(src, options)
      .then(() => {
        if (!cancelled) {
          setReady(true);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoading(false);
        }
      });

    // 清理函数：组件卸载时卸载脚本
    return () => {
      if (isScriptLoaded(src)) {
        unloadScript(src);
      }
      cancelled = true;
    };
  }, [src, JSON.stringify(options)]);

  return { ready, loading, error };
}