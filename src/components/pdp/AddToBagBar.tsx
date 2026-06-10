"use client";

import { useState } from "react";
import { toast } from "@/lib/stores/toast";
import { useAddToCart } from "@/lib/api/hooks/cart";
import { ApiError } from "@/lib/api/errors";

/**
 * Quantity stepper + Add-to-bag CTA (product-detail §5, §7, §8, AC6). On mobile
 * the bar is STICKY to the bottom so the primary action is always reachable.
 *
 * Add-to-bag is disabled-until-valid: enabled only when a complete in-stock
 * variant is resolved (`variantId` set). With no size the button shows "Select a
 * size"; tapping it triggers `onRequireSize` (inline error + scroll). On click it
 * hands { variant_id, quantity } to CART (server-confirmed); the mini-cart drawer
 * opens on success. INSUFFICIENT_STOCK/limit errors map to the §8 notices.
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
  const addToCart = useAddToCart();
  const pending = addToCart.isPending;

  if (notifyMode) return null;

  const ready = Boolean(variantId);

  async function onAdd() {
    if (!ready || !variantId) {
      onRequireSize();
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      toast("You're offline. Check your connection and try again.", "error");
      return;
    }
    try {
      const res = await addToCart.mutateAsync({ variant_id: variantId, quantity: qty });
      if (res.capped) toast("Only a few in stock — quantity adjusted.");
      else toast("Added to bag");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const available = (err.details?.[0]?.message ?? "").toString();
        toast(`Only ${available || "a few"} in stock — quantity adjusted.`, "error");
      } else {
        toast("Couldn't add to cart.", "error");
      }
    }
  }

  return (
    <div
      className={
        (sticky
          ? "sticky bottom-0 z-30 -mx-4 border-t border-border bg-white/90 px-4 py-3 backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0"
          : "") + " flex items-center gap-3"
      }
    >
      <div className="inline-flex h-12 items-center rounded-md border border-border-strong">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="grid h-12 w-11 place-items-center text-lg text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
        >
          −
        </button>
        <span aria-live="polite" className="w-8 text-center text-body-sm font-semibold text-ink">
          {qty}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((q) => q + 1)}
          className="grid h-12 w-11 place-items-center text-lg text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={onAdd}
        aria-disabled={!ready || pending}
        className={
          "inline-flex h-12 flex-1 items-center justify-center rounded-md px-6 text-body-sm font-semibold transition-colors duration-micro ease-out " +
          (ready
            ? "bg-volt text-ink hover:bg-volt-600"
            : "cursor-not-allowed bg-surface-100 text-text-faint")
        }
      >
        {pending ? "Adding…" : ready ? "Add to bag" : "Select a size"}
      </button>

      {trailing}
    </div>
  );
}

/**
 * Static assurance row beneath the buy box (product-detail §5, AC3). Design copy —
 * the free-delivery threshold is config; the returns policy is a static string.
 */
export function AssuranceRow() {
  return (
    <div className="space-y-1 border-t border-border pt-4 text-body-sm text-text-muted">
      <p>Delivery across Bangladesh · Cash on Delivery · bKash / Nagad</p>
      <p>Returns are exchange-only within 30 days.</p>
    </div>
  );
}
