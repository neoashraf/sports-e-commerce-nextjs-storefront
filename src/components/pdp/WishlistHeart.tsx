"use client";

import { WishlistHeart as SharedWishlistHeart } from "@/components/wishlist/WishlistHeart";
import type { GuestWishSnapshot } from "@/lib/stores/wishlist";

/**
 * PDP wishlist heart (product-detail §5, AC6) — a thin wrapper over the
 * canonical reusable control (wishlist-fe), styled as a bordered buy-box button.
 * Forwards a display snapshot so a guest save links by slug (not the bare id).
 */
export function WishlistHeart({
  productId,
  snapshot,
}: {
  productId: string;
  snapshot?: GuestWishSnapshot;
}) {
  return (
    <SharedWishlistHeart
      productId={productId}
      snapshot={snapshot}
      className="h-12 w-12 shrink-0 border border-gray-300"
    />
  );
}
