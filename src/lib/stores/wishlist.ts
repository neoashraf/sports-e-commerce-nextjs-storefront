import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Guest wishlist store (wishlist-fe, BR-WISH-5 / FR-WISH-030). A guest ♡ writes
 * here (local storage) with no login prompt; hearts + the wishlist page render
 * from it when unauthenticated. On login the items are POSTed to /me/wishlist/
 * merge and this store is cleared.
 *
 * For customers the server is authoritative — the count then comes from the
 * server total (set via `setServerCount`).
 */
/**
 * A lightweight display snapshot captured when a guest hearts a product, so the
 * guest wishlist page can render a real card (image, title, price) and link by
 * SLUG — not the bare UUID, which `/p/<uuid>` would 404 on. Optional: an older
 * stored item (or a heart with no snapshot to hand) falls back to id-only.
 */
export interface GuestWishSnapshot {
  slug: string;
  title: string;
  brand?: string | null;
  primary_image?: string | null;
  effective_price?: string;
  base_price?: string;
  on_sale?: boolean;
}

export interface GuestWishItem {
  product_id: string;
  preferred_variant_id?: string;
  snapshot?: GuestWishSnapshot;
}

interface WishlistState {
  /** Guest local items. */
  guestItems: GuestWishItem[];
  /** Server total for a logged-in customer (badge source when authenticated). */
  serverCount: number;

  addGuest: (item: GuestWishItem) => void;
  removeGuest: (productId: string) => void;
  hasGuest: (productId: string) => boolean;
  clearGuest: () => void;
  setServerCount: (n: number) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      guestItems: [],
      serverCount: 0,
      addGuest: (item) =>
        set((s) =>
          s.guestItems.some((g) => g.product_id === item.product_id)
            ? s
            : { guestItems: [...s.guestItems, item] },
        ),
      removeGuest: (productId) =>
        set((s) => ({ guestItems: s.guestItems.filter((g) => g.product_id !== productId) })),
      hasGuest: (productId) => get().guestItems.some((g) => g.product_id === productId),
      clearGuest: () => set({ guestItems: [] }),
      setServerCount: (serverCount) => set({ serverCount }),
    }),
    {
      name: "storefront-wishlist",
      partialize: (s) => ({ guestItems: s.guestItems }),
    },
  ),
);

/** Read guest items outside React (for merge-on-login). */
export function getGuestWishlist(): GuestWishItem[] {
  return useWishlistStore.getState().guestItems;
}
