"use client";

import { useRef } from "react";
import type { ProductCardLink } from "@/lib/api/schemas/catalog";
import type { ListingProduct } from "@/lib/api/schemas/search";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ChevronDownIcon } from "@/components/shell/icons";

/**
 * Related-product rail (product-detail §5, AC6) — "You may also like" /
 * "Complete the look". Reskinned to the v2 ProductCard in a scroll-snap rail with
 * desktop prev/next arrows. Section OMITTED when `items` is empty.
 *
 * Maps the PDP link shape onto the ListingProduct the v2 card consumes (the rail
 * carries no availability, so cards render in-stock; presentation-only).
 * Design source: docs/design/design-files/ui_kits/pdp-grid/PgDetails.jsx
 */
function toListingProduct(p: ProductCardLink): ListingProduct {
  return {
    id: p.id,
    slug: p.slug,
    title: p.name,
    brand: undefined,
    primary_image: p.primary_image ?? null,
    effective_price: p.effective_price ?? "0",
    base_price: p.base_price,
    on_sale: p.on_sale ?? false,
    currency: "BDT",
    availability: "in_stock",
    // RW6 card fields — let the related rail render the full v2 card.
    name_bn: p.name_bn ?? null,
    hover_image: p.hover_image ?? null,
    swatches: p.swatches ?? [],
    requires_variant: p.requires_variant ?? false,
    merch_label: p.merch_label ?? null,
  };
}

export function ProductCarousel({
  title,
  items,
}: {
  title: string;
  items: ProductCardLink[];
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  if (items.length === 0) return null;

  function scrollBy(dir: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  const arrowClass =
    "grid h-9 w-9 place-items-center rounded-full border border-border-strong text-ink transition-colors duration-micro ease-out hover:border-volt-600 hover:text-volt-600";

  return (
    <section className="border-t border-border py-section-y sm:py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="break-words text-h2 font-bold tracking-snug text-ink">{title}</h2>
        <div className="hidden shrink-0 gap-1 lg:flex">
          <button type="button" aria-label="Previous" onClick={() => scrollBy(-1)} className={arrowClass}>
            <ChevronDownIcon className="h-4 w-4 rotate-90" />
          </button>
          <button type="button" aria-label="Next" onClick={() => scrollBy(1)} className={arrowClass}>
            <ChevronDownIcon className="h-4 w-4 -rotate-90" />
          </button>
        </div>
      </div>
      <ul
        ref={scrollerRef}
        aria-label={`${title}, carousel`}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((p) => (
          <li key={p.id} className="w-44 shrink-0 snap-start sm:w-52">
            <ProductCard product={toListingProduct(p)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
