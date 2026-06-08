"use client";

import Link from "next/link";
import type { ListingProduct, Availability } from "@/lib/api/schemas/search";
import { formatBDT } from "@/lib/format";
import { WishlistHeart } from "@/components/wishlist/WishlistHeart";

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
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-200 p-3 text-center"
              aria-hidden="true"
            >
              <svg
                className="h-10 w-10 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 4.5h15a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18V6a1.5 1.5 0 011.5-1.5z"
                />
              </svg>
              <span className="line-clamp-2 text-[11px] font-medium text-gray-400">
                {product.title}
              </span>
            </div>
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

      {withWishlist && (
        <WishlistHeart
          productId={product.id}
          snapshot={{
            slug: product.slug,
            title: product.title,
            brand: product.brand,
            primary_image: product.primary_image,
            effective_price: product.effective_price,
            base_price: product.base_price,
            on_sale: product.on_sale,
          }}
          size="sm"
          className="absolute right-2 top-2 bg-white/90 shadow-sm hover:bg-white"
        />
      )}
    </div>
  );
}
