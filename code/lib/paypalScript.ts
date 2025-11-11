// 动态加载 PayPal Web SDK v6 core（默认 sandbox）
// - 单例 + 并发复用
// - 支持切换 src 时自动卸载重载
// - 无任何支付逻辑

import { PAYPALSDKURL } from "@/hooks/usePayPalWebSdk";

let currentScript: HTMLScriptElement | null = null;
let currentSrc: string | null = null;
let loadPromise: Promise<void> | null = null;
let loaded = false;

const SANDBOX_SRC = "https://www.sandbox.paypal.com/web-sdk/v6/core";
const PRODUCTION_SRC = "https://www.paypal.com/web-sdk/v6/core";

const SCRIPT_ID = "paypal-websdk-v6-core";

export function loadPayPalWebSdk(srcType: PAYPALSDKURL): Promise<void> {
  const src = srcType === PAYPALSDKURL.SANDBOX_SRC ? SANDBOX_SRC : PRODUCTION_SRC;

  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadPayPalWebSdk 必须在客户端调用"));
  }

  // 已加载且 src 相同，直接返回
  if (loaded && currentSrc === src) return Promise.resolve();

  // 正在加载相同 src，复用同一 promise
  if (loadPromise && currentSrc === src) return loadPromise;

  // 若已有脚本但 src 不同，则先卸载
  if (currentScript && currentSrc && currentSrc !== src) {
    try {
      currentScript.remove();
    } catch { }
    currentScript = null;
    currentSrc = null;
    loaded = false;
    loadPromise = null;
  }

  // 若 DOM 中已存在旧的同 ID 标签（例如热更新或外部插入），按 src 判断是否复用/替换
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    if (existing.src === src || existing.getAttribute("src") === src) {
      // 已存在相同 src 的标签，但不确定加载态；挂载事件
      loadPromise = new Promise<void>((resolve, reject) => {
        if ((existing as any)._ready === true) {
          loaded = true;
          currentScript = existing;
          currentSrc = src;
          resolve();
          return;
        }
        existing.addEventListener("load", () => {
          (existing as any)._ready = true;
          loaded = true;
          currentScript = existing;
          currentSrc = src;
          resolve();
        });
        existing.addEventListener("error", () => {
          loaded = false;
          reject(new Error("PayPal Web SDK 加载失败"));
        });
      });
      return loadPromise;
    } else {
      // 同 ID 但不同 src，移除后重新插入
      try {
        existing.remove();
      } catch { }
    }
  }

  // 创建并加载新脚本
  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = src;
    script.crossOrigin = "anonymous";

    script.addEventListener("load", () => {
      (script as any)._ready = true;
      loaded = true;
      currentScript = script;
      currentSrc = src;
      resolve();
    });

    script.addEventListener("error", () => {
      loaded = false;
      // 失败时清理引用，便于下次重试
      if (currentScript === script) {
        currentScript = null;
        currentSrc = null;
      }
      loadPromise = null;
      reject(new Error("PayPal Web SDK 加载失败"));
    });

    document.head.appendChild(script);
    currentScript = script;
    currentSrc = src;
  });

  return loadPromise;
}

export function isPayPalWebSdkLoaded(): boolean {
  return loaded;
}

export function getPayPalWebSdkSrc(): string | null {
  return currentSrc;
}

export function unloadPayPalWebSdk(): void {
  if (typeof window === "undefined") return;
  if (currentScript) {
    try {
      currentScript.remove();
    } catch { }
  }
  currentScript = null;
  currentSrc = null;
  loaded = false;
  loadPromise = null;
}