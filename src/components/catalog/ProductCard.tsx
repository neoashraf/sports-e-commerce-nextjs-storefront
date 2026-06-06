"use client";

import Link from "next/link";
import { useState } from "react";
import type { ListingProduct, Availability } from "@/lib/api/schemas/search";
import { formatBDT } from "@/lib/format";
import { useAuth } from "@/lib/hooks/useAuth";
import { useWishlistCount } from "@/lib/stores/wishlist";
import { toast } from "@/lib/stores/toast";

/**
 * Shared SRCH/PLP product card — used on the home carousels, PDP related
 * carousels, and the listing grid. Shows image, 2-line Bangla-safe name,
 * effective price (৳), struck base + "Sale" on sale, "New"/"Out of stock"
 * badges. With `withWishlist`, also renders an availability label + a wishlist
 * heart (optimistic toggle; guest → phone-OTP sheet then resume — WISH owns the
 * real mutation, stubbed here and flagged).
 */
function toAmount(p?: string): number {
  const n = Number(p);
  return Number.isFinite(n) ? n : 0;
}

const AVAILABILITY_LABEL: Record<Availability, string> = {
  in_stock: "In stock",
  low_stock: "Only a few left",
  out_of_stock: "Out of stock",
};

export function ProductCard({
  product,
  withWishlist = false,
}: {
  product: ListingProduct;
  withWishlist?: boolean;
}) {
  const eff = toAmount(product.effective_price);
  const base = toAmount(product.base_price);
  const showStrike = product.on_sale && base > eff;
  const oos = product.availability === "out_of_stock";

  return (
    <div className={"relative " + (oos ? "opacity-75" : "")}>
      <Link href={`/p/${product.slug}`} className="group block focus-visible:outline-none">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          {product.primary_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.primary_image}
              alt={product.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full" aria-hidden="true" />
          )}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.is_new && (
              <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                New
              </span>
            )}
            {showStrike && (
              <span className="rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                Sale
              </span>
            )}
            {oos && (
              <span className="rounded bg-gray-700 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                Out of stock
              </span>
            )}
          </div>
        </div>
        {product.brand && (
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            {product.brand}
          </p>
        )}
        <p className={(product.brand ? "mt-0.5 " : "mt-2 ") + "line-clamp-2 break-words text-sm text-gray-800 group-hover:text-brand-600"}>
          {product.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{formatBDT(eff)}</span>
          {showStrike && (
            <span className="text-xs text-gray-400 line-through">{formatBDT(base)}</span>
          )}
        </div>
        {withWishlist && (
          <p className={"mt-0.5 text-xs " + (oos ? "text-gray-500" : product.availability === "low_stock" ? "text-amber-700" : "text-green-700")}>
            {AVAILABILITY_LABEL[product.availability]}
          </p>
        )}
      </Link>

      {withWishlist && <WishlistHeartButton productId={product.id} />}
    </div>
  );
}

/** Small optimistic wishlist heart overlaid on a listing card (separate ≥44px button). */
function WishlistHeartButton({ productId }: { productId: string }) {
  const { isAuthenticated, requireAuth } = useAuth();
  const count = useWishlistCount((s) => s.count);
  const setCount = useWishlistCount((s) => s.setCount);
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

  return (
    <button
      type="button"
      onClick={() => (isAuthenticated ? doToggle() : requireAuth(doToggle))}
      aria-pressed={filled}
      aria-label={filled ? "Remove from wishlist" : "Add to wishlist"}
      className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5.5 5.5 5.5c1.9 0 3.2 1.1 4 2.2.8-1.1 2.1-2.2 4-2.2 3 0 4.5 3 3 6C19 15.65 12 20 12 20z" />
      </svg>
    </button>
  );
}
