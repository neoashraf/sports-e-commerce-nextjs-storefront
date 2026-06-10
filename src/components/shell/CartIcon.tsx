"use client";

import { useCartCount, useCartStore } from "@/lib/stores/cart";
import { BagIcon } from "./icons";
import { CountBadge } from "./CountBadge";

/**
 * Cart header affordance (storefront-shell §5 + cart-core-fe). Bag icon + live
 * line-item badge (sum of quantities, hidden at 0, capped at "9+") from the cart
 * store. Tapping opens the mini-cart drawer (read-only) mounted by cart-core-fe.
 */
export function CartIcon() {
  const count = useCartCount();
  const openDrawer = useCartStore((s) => s.openDrawer);

  return (
    <button
      type="button"
      onClick={() => openDrawer()}
      aria-label={`Cart (${count} items)`}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
    >
      <BagIcon />
      <CountBadge count={count} cap={9} />
    </button>
  );
}
