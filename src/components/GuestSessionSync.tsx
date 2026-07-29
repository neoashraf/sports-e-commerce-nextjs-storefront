"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cartKeys, mergeGuestCart } from "@/lib/api/hooks/cart";
import { wishlistKeys, mergeGuestWishlist } from "@/lib/api/hooks/wishlist";
import { useAuthStore } from "@/lib/stores/auth";
import { useCartStore } from "@/lib/stores/cart";
import { useWishlistStore } from "@/lib/stores/wishlist";

/**
 * Guest → account handover (FR-CART-007, FR-WISH-031), mounted once in the app chrome.
 *
 * The backend resolves a signed-in shopper's cart by `customer_id` alone — it never falls back
 * to the guest `X-Cart-Token` — so a guest cart reads as EMPTY from the moment of login until
 * `POST /cart/merge` runs. That merge used to live only inside checkout's "place order" path,
 * which meant logging in from anywhere else (header, auth sheet, /login, the checkout page
 * before pressing Place) silently lost the cart. The guest wishlist had the same gap: the merge
 * hook existed but nothing ever called it.
 *
 * Trigger: authenticated AND guest leftovers exist. A guest token / local wishlist has no
 * meaning for a signed-in shopper, so merging is always correct — both calls are idempotent
 * server-side and clear their local source on success. A failure keeps the local state so a
 * later mount can retry.
 */
export function GuestSessionSync() {
  const isAuth = !!useAuthStore((s) => s.tokens);
  const cartToken = useCartStore((s) => s.cartToken);
  const guestWishCount = useWishlistStore((s) => s.guestItems.length);
  const qc = useQueryClient();
  // Guards against a second pass while the first is still in flight (both merges clear their
  // own source, so the dependencies below change mid-run).
  const running = useRef(false);

  useEffect(() => {
    if (!isAuth || running.current) return;
    if (!cartToken && guestWishCount === 0) return;
    running.current = true;

    void (async () => {
      try {
        if (await mergeGuestCart()) {
          await qc.invalidateQueries({ queryKey: cartKeys.cart });
        }
      } catch {
        // Keep the guest token — the cart is still intact server-side and a later mount retries.
      }
      try {
        if (await mergeGuestWishlist()) {
          await qc.invalidateQueries({ queryKey: wishlistKeys.list });
        }
      } catch {
        // Keep the local list for a later retry.
      }
      running.current = false;
    })();
  }, [isAuth, cartToken, guestWishCount, qc]);

  return null;
}
