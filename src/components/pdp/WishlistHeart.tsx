"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useWishlistCount } from "@/lib/stores/wishlist";
import { toast } from "@/lib/stores/toast";

/**
 * Wishlist heart toggle (product-detail §5, §10, AC6). Outline ↔ filled.
 *
 * The real persistence is owned by WISH (wishlist-fe) — OUT OF SCOPE here. This
 * delegates to a STUBBED toggle: a guest tap opens the phone-OTP sheet and
 * resumes the toggle on success; a logged-in tap flips local state + the shell
 * badge. Integration point flagged in the PR.
 */
export function WishlistHeart({ productId }: { productId: string }) {
  const { isAuthenticated, requireAuth } = useAuth();
  const setCount = useWishlistCount((s) => s.setCount);
  const count = useWishlistCount((s) => s.count);
  const [filled, setFilled] = useState(false);

  function doToggle() {
    setFilled((f) => {
      const next = !f;
      // TODO(WISH): replace with the real add/remove mutation for `productId`.
      void productId;
      setCount(Math.max(0, count + (next ? 1 : -1)));
      toast(next ? "Added to wishlist" : "Removed from wishlist");
      return next;
    });
  }

  function onClick() {
    if (!isAuthenticated) {
      requireAuth(doToggle);
      return;
    }
    doToggle();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={filled}
      aria-label={filled ? "Remove from wishlist" : "Add to wishlist"}
      className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
    >
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5.5 5.5 5.5c1.9 0 3.2 1.1 4 2.2.8-1.1 2.1-2.2 4-2.2 3 0 4.5 3 3 6C19 15.65 12 20 12 20z"
        />
      </svg>
    </button>
  );
}
