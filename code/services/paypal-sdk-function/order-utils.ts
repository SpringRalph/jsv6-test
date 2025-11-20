"use client"
import { CART_STORAGE_KEY, useCartStore } from "@/store/useCartStore";

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

export const getOrderConfig = () => {
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

    return payload
}