"use client";

import { WishlistHeart as SharedWishlistHeart } from "@/components/wishlist/WishlistHeart";

/**
 * PDP wishlist heart (product-detail §5, AC6) — a thin wrapper over the
 * canonical reusable control (wishlist-fe), styled as a bordered buy-box button.
 */
export function WishlistHeart({ productId }: { productId: string }) {
  return (
    <SharedWishlistHeart
      productId={productId}
      className="h-12 w-12 shrink-0 border border-gray-300"
    />
  );
}
