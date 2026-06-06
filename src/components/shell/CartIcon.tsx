"use client";

import Link from "next/link";
import { useCartCount } from "@/lib/stores/cart";
import { BagIcon } from "./icons";
import { CountBadge } from "./CountBadge";

/**
 * Cart header affordance (storefront-shell §5). Bag icon + live line-item badge
 * (hidden at 0, capped at "9+") from the CART store. The mini-cart flyout is
 * owned by the CART briefs and is OUT OF SCOPE here — the shell routes to the
 * cart page as the entry point.
 */
export function CartIcon() {
  const count = useCartCount((s) => s.count);

  return (
    <Link
      href="/cart"
      aria-label={`Cart (${count} items)`}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
    >
      <BagIcon />
      <CountBadge count={count} cap={9} />
    </Link>
  );
}
