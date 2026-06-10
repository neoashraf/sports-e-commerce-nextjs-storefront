"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useWishlistStore } from "@/lib/stores/wishlist";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlist,
} from "@/lib/api/hooks/wishlist";
import type { GuestWishSnapshot } from "@/lib/stores/wishlist";
import { ApiError } from "@/lib/api/errors";
import { toast } from "@/lib/stores/toast";

/**
 * Reusable wishlist ♡ toggle (wishlist-fe — the canonical control hosted by
 * product cards + the PDP). Outline ↔ filled with `aria-pressed` + accessible
 * names. Optimistic with revert + toast on error. Customer → server
 * POST/DELETE; guest → local store (no login prompt, BR-WISH-5). Guards
 * double-submit. `409 WISHLIST_FULL` reverts + shows the full toast.
 */
export function WishlistHeart({
  productId,
  preferredVariantId,
  snapshot,
  size = "md",
  className = "",
}: {
  productId: string;
  preferredVariantId?: string;
  /**
   * Display snapshot (slug/title/price/image) stored alongside a guest save so
   * the guest wishlist page can render a real card and link by slug. Provided by
   * product cards; omitted by the PDP heart (which only knows the id).
   */
  snapshot?: GuestWishSnapshot;
  size?: "sm" | "md";
  className?: string;
}) {
  const tokens = useAuthStore((s) => s.tokens);
  const isAuth = !!tokens;

  const hasGuest = useWishlistStore((s) => s.guestItems.some((g) => g.product_id === productId));
  const addGuest = useWishlistStore((s) => s.addGuest);
  const removeGuest = useWishlistStore((s) => s.removeGuest);

  // Authenticated source of truth: the cached server wishlist (loaded by the
  // navbar icon + the wishlist page). Drives BOTH the filled state on load and
  // the item_id needed to unsave — so the heart reflects reality and removal works.
  const { data: serverItems } = useWishlist();
  const savedItem = isAuth
    ? serverItems?.find((i) => i.product.id === productId) ?? null
    : null;

  const add = useAddToWishlist();
  const remove = useRemoveFromWishlist();

  // Optimistic override: null = follow the server; true/false = pending local intent.
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const filled = isAuth
    ? optimistic ?? !!savedItem
    : hasGuest;
  const [pending, setPending] = useState(false);

  async function onToggle() {
    if (pending) return;
    const next = !filled;

    if (!isAuth) {
      // Guest: local store, no network, no login prompt.
      if (next) addGuest({ product_id: productId, preferred_variant_id: preferredVariantId, snapshot });
      else removeGuest(productId);
      toast(next ? "Added to wishlist" : "Removed from wishlist");
      return;
    }

    setPending(true);
    setOptimistic(next); // optimistic
    try {
      if (next) {
        await add.mutateAsync({ product_id: productId, preferred_variant_id: preferredVariantId });
        toast("Added to wishlist");
      } else if (savedItem) {
        await remove.mutateAsync(savedItem.item_id);
        toast("Removed from wishlist");
      }
      // Let the refetched server list take over (clears the optimistic override).
      setOptimistic(null);
    } catch (err) {
      setOptimistic(null); // revert to server truth
      if (err instanceof ApiError && err.code === "WISHLIST_FULL") {
        const max = (err as ApiError).details?.[0]?.message ?? "100";
        toast(`Your wishlist is full (max ${max}). Remove an item to add more.`, "error");
      } else {
        toast("Something went wrong. Please try again.", "error");
      }
    } finally {
      setPending(false);
    }
  }

  const dim = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const box = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={filled}
      aria-label={filled ? "Remove from wishlist" : "Add to wishlist"}
      className={
        `grid ${box} place-items-center rounded-full transition-colors duration-micro ease-out hover:bg-surface-100 ` +
        (filled ? "text-volt-600 " : "text-ink-700 ") +
        className
      }
    >
      <svg className={dim} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5.5 5.5 5.5c1.9 0 3.2 1.1 4 2.2.8-1.1 2.1-2.2 4-2.2 3 0 4.5 3 3 6C19 15.65 12 20 12 20z" />
      </svg>
    </button>
  );
}
