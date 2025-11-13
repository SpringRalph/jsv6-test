import toast from "react-hot-toast";
import { CART_STORAGE_KEY, useCartStore } from "@/store/useCartStore";

export async function getBrowserSafeClientToken(): Promise<string> {
  if (typeof window === "undefined") throw new Error("getBrowserSafeClientToken must be called in browser");

  const res = await fetch("/api/paypal/client-token");
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch client token: ${text}`);
  }

  const json = await res.json();
  if (!json?.clientToken) throw new Error("No clientToken in response");
  return json.clientToken;
}

// 交易成功：简洁通知
export function handlePaymentSuccess(orderData?: any): void {
  if (typeof window === "undefined") return;
  const id = orderData?.id ?? orderData?.orderId ?? "";
  const msg = id ? `交易已完成 — 订单号：${id}` : "交易已完成。";
  toast.success(msg, { duration: 5000 });
}

// 交易失败：错误通知
export function handlePaymentError(error?: any): void {
  if (typeof window === "undefined") return;
  const msg =
    error?.message ?? (typeof error === "string" ? error : JSON.stringify(error ?? {}));
  toast.error(`交易失败：${msg || "请稍后重试。"}`, { duration: 7000 });
}

// 交易取消：中性提示
export function handlePaymentCancellation(): void {
  if (typeof window === "undefined") return;
  toast("交易已取消。", { icon: "⚠️", duration: 4000 });
}

function readPersistedCartFromStorage(): any | null {
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY) ?? localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // zustand persist 可能存为 { state: { ... } }，也可能直接存 state
    return parsed?.state ?? parsed;
  } catch {
    return null;
  }
}

export async function createOrder(): Promise<any> {
  if (typeof window === "undefined") throw new Error("createOrder must be called in browser");

  // 优先内存中的 zustand state
  let cartState: any = null;
  try {
    cartState = useCartStore.getState();
  } catch {
    cartState = null;
  }

  // 若 store 中没有（或还未 rehydrate），回退到 storage
  const persisted = cartState?.product ? cartState : readPersistedCartFromStorage();

  if (!persisted || !persisted.product) {
    throw new Error("购物车为空或格式不正确");
  }



  // 组装 items：支持两种结构：
  // 1) persisted.items: [{ id, title/name, price, quantity }]
  // 2) persisted.product + persisted.quantity
  const items: Array<{
    id: string;
    name: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }> = [];

  if (Array.isArray(persisted.items) && persisted.items.length > 0) {
    for (const it of persisted.items) {
      const quantity = Number(it.quantity ?? 1);
      const unitPrice = Number(it.price ?? it.unitPrice ?? 0);
      const total = Number((unitPrice * quantity).toFixed(2));
      items.push({
        id: String(it.id ?? it.sku ?? it.productId ?? "unknown"),
        name: String(it.title ?? it.name ?? it.productName ?? "Product"),
        unitPrice,
        quantity,
        total,
      });
    }
  } else if (persisted.product) {
    const prod = persisted.product;
    const quantity = Number(persisted.quantity ?? 1);
    const unitPrice = Number(prod.price ?? 0);
    const total = Number((unitPrice * quantity).toFixed(2));
    items.push({
      id: String(prod.id ?? prod.sku ?? "product"),
      name: String(prod.title ?? prod.name ?? "Product"),
      unitPrice,
      quantity,
      total,
    });
  }

  const totalAmount = Number(items.reduce((s, it) => s + it.total, 0).toFixed(2));
  const currency = persisted.currency ?? "USD";
  const meta = persisted.meta ?? {};

  const payload = {
    items,
    totalAmount,
    currency,
    meta,
  };

  const res = await fetch("/api/paypal/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`创建订单失败: ${res.status} ${text}`);
  }

  const json = await res.json();
  if (!json) throw new Error("后端未返回创建订单结果");
  return json;
}

export async function captureOrder(orderIdOrObj: string | { orderId?: string }): Promise<any> {
  if (typeof window === "undefined") throw new Error("captureOrder must be called in browser");

  const orderId = typeof orderIdOrObj === "string" ? orderIdOrObj : String(orderIdOrObj?.orderId ?? "");
  if (!orderId) throw new Error("orderId is required to capture order");

  try {
    const res = await fetch("/api/paypal/capture-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      const details = (() => {
        try { return JSON.parse(text); } catch { return text; }
      })();
      const err = new Error(`capture failed: ${res.status} ${JSON.stringify(details)}`);
      // 调用失败通知
      handlePaymentError(err);
      throw err;
    }

    const json = text ? JSON.parse(text) : {};
    // 成功：调用成功处理器并返回结果
    try {
      handlePaymentSuccess(json);
    } catch {
      // ignore UI handler errors
    }
    return json;
  } catch (err: any) {
    // 网络或其它异常时调用错误处理器
    try { handlePaymentError(err); } catch {}
    throw err;
  }
}
