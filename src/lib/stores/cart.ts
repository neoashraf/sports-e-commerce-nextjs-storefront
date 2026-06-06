import { create } from "zustand";

/**
 * Minimal cart-count store — a TYPED PLACEHOLDER for the shell's cart badge.
 *
 * cms-storefront-shell-fe only reads the line-item count to render the cart
 * badge (AC5); the real cart state, mutations, and mini-cart are owned by the
 * CART briefs (cart-core-fe), which will replace/extend this store. Until then
 * the badge reads 0 and the dependency is flagged in the shell PR.
 */
interface CartCountState {
  /** Distinct line-item count shown on the cart badge (caps at "9+" in the UI). */
  count: number;
  setCount: (count: number) => void;
}

export const useCartCount = create<CartCountState>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
}));
