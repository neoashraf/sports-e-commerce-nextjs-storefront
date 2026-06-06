"use client";

import { useState } from "react";
import { toast } from "@/lib/stores/toast";
import { useCartCount } from "@/lib/stores/cart";

/**
 * Quantity stepper + Add-to-bag CTA (product-detail §5, §7, §8, AC6). On mobile
 * the bar is STICKY to the bottom so the primary action is always reachable.
 *
 * Add-to-bag is disabled-until-valid: enabled only when a complete in-stock
 * variant is resolved (`variantId` set). With no size the button shows "Select a
 * size"; tapping it triggers `onRequireSize` (inline error + scroll). The actual
 * cart mutation is owned by CART (cart-core-fe) — here it's a STUBBED
 * server-confirm that updates the shell badge + shows "Added to bag". Flagged.
 */
export function AddToBagBar({
  variantId,
  notifyMode,
  onRequireSize,
  sticky = true,
  trailing,
}: {
  /** Resolved in-stock variant id, or undefined when not yet sellable. */
  variantId?: string;
  /** When true the variant/product is OOS — caller renders NotifyMe instead. */
  notifyMode?: boolean;
  onRequireSize: () => void;
  sticky?: boolean;
  /** Optional trailing control rendered in the bar row (e.g. the wishlist heart). */
  trailing?: React.ReactNode;
}) {
  const [qty, setQty] = useState(1);
  const [pending, setPending] = useState(false);
  const cartCount = useCartCount((s) => s.count);
  const setCartCount = useCartCount((s) => s.setCount);

  if (notifyMode) return null;

  const ready = Boolean(variantId);

  async function onAdd() {
    if (!ready) {
      onRequireSize();
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      toast("You're offline. Check your connection and try again.", "error");
      return;
    }
    setPending(true);
    try {
      // TODO(CART): replace with the real server-confirmed add-to-bag mutation
      // that hands { variant_id: variantId, qty } to CART and reconciles price.
      await Promise.resolve();
      setCartCount(cartCount + qty);
      toast("Added to bag");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={
        (sticky
          ? "sticky bottom-0 z-30 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0"
          : "") + " flex items-center gap-3"
      }
    >
      <div className="inline-flex h-12 items-center rounded-lg border border-gray-300">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="grid h-12 w-11 place-items-center text-lg text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
        >
          −
        </button>
        <span aria-live="polite" className="w-8 text-center text-sm font-medium">
          {qty}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((q) => q + 1)}
          className="grid h-12 w-11 place-items-center text-lg text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={onAdd}
        aria-disabled={!ready || pending}
        className={
          "inline-flex h-12 flex-1 items-center justify-center rounded-lg px-6 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 " +
          (ready
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "cursor-not-allowed bg-gray-200 text-gray-500")
        }
      >
        {pending ? "Adding…" : ready ? "Add to bag" : "Select a size"}
      </button>

      {trailing}
    </div>
  );
}
