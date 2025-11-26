

import { loadScript, isScriptLoaded, unloadScript } from "./scriptLoader";

export enum PAYPALSDKURL {
  SANDBOX_SRC = "SANDBOX",
  PRODUCTION_SRC = "PRODUCTION",
}

const SANDBOX_SRC = "https://www.sandbox.paypal.com/web-sdk/v6/core";
const PRODUCTION_SRC = "https://www.paypal.com/web-sdk/v6/core";

export function loadPayPalWebSdk(srcType: PAYPALSDKURL): Promise<void> {
  const src = srcType === PAYPALSDKURL.SANDBOX_SRC ? SANDBOX_SRC : PRODUCTION_SRC;
  return loadScript(src, {
    attributes: {
      id: "paypal-websdk-v6-core",
      crossOrigin: "anonymous"
    }
  });
}

export function isPayPalWebSdkLoaded(): boolean {
  // 检查是否在浏览器环境中
  if (typeof window === "undefined") return false;
  
  const element = document.getElementById("paypal-websdk-v6-core");
  if (!element) return false;
  
  const src = element.getAttribute("src");
  return src ? isScriptLoaded(src) : false;
}

export function getPayPalWebSdkSrc(): string {
  // 检查是否在浏览器环境中
  if (typeof window === "undefined") return "";
  
  const element = document.getElementById("paypal-websdk-v6-core");
  return element ? element.getAttribute("src") || "" : "";
}

export function unloadPayPalWebSdk(): void {
  const src = getPayPalWebSdkSrc();
  if (src) {
    unloadScript(src);
  }
}