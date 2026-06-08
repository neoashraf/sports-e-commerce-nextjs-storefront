"use client";

import Link from "next/link";
import { useWishlist, useWishlistCount } from "@/lib/api/hooks/wishlist";
import { HeartIcon } from "./icons";
import { CountBadge } from "./CountBadge";

/**
 * Wishlist header affordance (storefront-shell §5). Heart icon + live count
 * badge (hidden at 0) from the WISH store; routes to the wishlist page. The
 * accessible name carries the live count ("Wishlist ({n} items)").
 *
 * Subscribes to `useWishlist()` so the authenticated server count is fetched +
 * kept live here — otherwise `serverCount` (set only inside that query) stays 0
 * until the wishlist page is visited, and the badge never appears. The query is
 * gated by auth + cached, so guests don't fire it and this is cheap.
 */
export function WishlistIcon() {
  useWishlist();
  const count = useWishlistCount();

  return (
    <Link
      href="/wishlist"
      aria-label={`Wishlist (${count} items)`}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
    >
      <HeartIcon />
      <CountBadge count={count} />
    </Link>
  );
}
