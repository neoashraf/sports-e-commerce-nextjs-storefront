import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cart } from "@/lib/api/schemas/cart";

/**
 * Cart client store (cart-core-fe). Holds the latest server cart snapshot, the
 * derived item count for the shell badge, the mini-cart drawer open state, and
 * the persisted guest `X-Cart-Token` sent on every cart request. The displayed
 * subtotal always comes from the server snapshot — never client-summed.
 */
interface CartState {
  cart: Cart | null;
  /** Guest identity for the cart, persisted across reloads (X-Cart-Token). */
  cartToken: string | null;
  /** Mini-cart drawer visibility + the just-added line to highlight. */
  drawerOpen: boolean;
  justAddedItemId: string | null;

  setCart: (cart: Cart) => void;
  setCartToken: (token: string | null) => void;
  openDrawer: (justAddedItemId?: string | null) => void;
  closeDrawer: () => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: null,
      cartToken: null,
      drawerOpen: false,
      justAddedItemId: null,
      setCart: (cart) => set({ cart }),
      setCartToken: (cartToken) => set({ cartToken }),
      openDrawer: (justAddedItemId = null) => set({ drawerOpen: true, justAddedItemId }),
      closeDrawer: () => set({ drawerOpen: false, justAddedItemId: null }),
      clear: () => set({ cart: null }),
    }),
    {
      name: "storefront-cart",
      // Only the guest token must survive reloads; the snapshot is re-fetched.
      partialize: (s) => ({ cartToken: s.cartToken }),
    },
  ),
);

/** Sum-of-quantities count for the shell cart badge (single source of truth). */
export function useCartCount() {
  return useCartStore((s) => s.cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0);
}

/** Read the guest cart token outside React (for the API client header). */
export function getCartToken(): string | null {
  return useCartStore.getState().cartToken;
}

/** Persist the guest cart token outside React (after a server mint). */
export function setCartToken(token: string | null): void {
  useCartStore.getState().setCartToken(token);
}
