import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartState, Product } from "@/types/cart"

export const CART_STORAGE_KEY = "pp-v6-cart";

interface CartStore extends CartState {
  incrementQuantity: () => void
  decrementQuantity: () => void
  clearCart: () => void
  setQuantity: (quantity: number) => void
}

const testProduct: Product = {
  id: "test-product-1",
  title: "Test Product",
  price: 29.99,
}

const initialState: CartState = {
  product: testProduct,
  quantity: 1,
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      ...initialState,
      incrementQuantity: () => set((state) => ({ quantity: state.quantity + 1 })),
      decrementQuantity: () =>
        set((state) => ({
          quantity: Math.max(1, state.quantity - 1),
        })),
      clearCart: () => set({ quantity: 1 }),
      setQuantity: (quantity: number) => set({ quantity }),
    }),
    {
      name: "pp-v6-cart",
    },
  ),
)

export const useCartTotal = () => {
  return useCartStore((state) => state.product.price * state.quantity)
}