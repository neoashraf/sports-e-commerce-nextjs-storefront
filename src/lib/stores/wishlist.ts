import { create } from "zustand";

/**
 * Minimal wishlist-count store — a TYPED PLACEHOLDER for the shell's wishlist
 * badge.
 *
 * cms-storefront-shell-fe only reads the item count to render the heart badge
 * (AC5); the real wishlist state and mutations are owned by the WISH briefs
 * (wishlist-fe), which will replace/extend this store. Until then the badge
 * reads 0 and the dependency is flagged in the shell PR.
 */
interface WishlistCountState {
  /** Saved-item count shown on the wishlist badge (hidden at 0). */
  count: number;
  setCount: (count: number) => void;
}

export const useWishlistCount = create<WishlistCountState>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
}));
