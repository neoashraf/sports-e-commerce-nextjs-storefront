import Link from "next/link";
import type { ListingProduct } from "@/lib/api/schemas/search";
import { formatBDT } from "@/lib/format";

/**
 * Shared SRCH/PLP product card (product-detail related carousels + home + search
 * results). OWNED by SRCH conceptually; defined here as the shared card since
 * SRCH FE isn't built yet (dependency flagged in cms-home-fe PR). Shows image,
 * 2-line Bangla-safe name, effective price (৳), struck base + "Sale" on sale,
 * "New" badge, and an "Out of stock" badge. Tap → PDP /p/<slug>.
 */
function toAmount(p?: string): number {
  const n = Number(p);
  return Number.isFinite(n) ? n : 0;
}

export function ProductCard({ product }: { product: ListingProduct }) {
  const eff = toAmount(product.effective_price);
  const base = toAmount(product.base_price);
  const showStrike = product.on_sale && base > eff;
  const oos = product.availability === "out_of_stock";

  return (
    <Link
      href={`/p/${product.slug}`}
      className="group block focus-visible:outline-none"
    >
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
      <p className="mt-2 line-clamp-2 break-words text-sm text-gray-800 group-hover:text-brand-600">
        {product.title}
      </p>
      <div className="mt-0.5 flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{formatBDT(eff)}</span>
        {showStrike && (
          <span className="text-xs text-gray-400 line-through">{formatBDT(base)}</span>
        )}
      </div>
    </Link>
  );
}
