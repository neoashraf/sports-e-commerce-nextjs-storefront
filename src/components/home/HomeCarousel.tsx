"use client";

import { useId, useRef } from "react";
import type { ListingProduct } from "@/lib/api/schemas/search";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ChevronDownIcon } from "@/components/shell/icons";

/**
 * Home product carousel (home §5, §6, §10, AC5/AC9). A labelled, scroll-snap
 * region with real prev/next buttons and a ~1.5-card mobile peek. Uses an
 * eyebrow + title header (SectionHeader pattern inline so the prev/next sit on
 * the same baseline). Renders its own loading skeleton and section-error
 * (+ "Retry"). OOS items are hidden (home §13.2); an empty settled section is
 * OMITTED (returns null).
 *
 * Design source: docs/design/design-files/ui_kits/landing/LpCarousel.jsx
 */
export function HomeCarousel({
  id,
  title,
  eyebrow,
  items,
  isLoading,
  isError,
  onRetry,
}: {
  id?: string;
  title: string;
  eyebrow?: string;
  items: ListingProduct[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}) {
  const headingId = useId();
  const scrollerRef = useRef<HTMLUListElement>(null);

  function scrollBy(dir: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  // Hide out-of-stock items from the rail (home §13.2).
  const visible = items.filter((p) => p.availability !== "out_of_stock");

  // Omit an empty, settled section entirely.
  if (!isLoading && !isError && visible.length === 0) return null;

  const arrowClass =
    "grid h-9 w-9 place-items-center rounded-full border border-border-strong text-ink transition-colors duration-micro ease-out hover:border-volt-600 hover:text-volt-600";

  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-24 py-section-y sm:py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          {eyebrow && (
            <span className="text-label font-semibold uppercase tracking-wide text-volt-600">
              {eyebrow}
            </span>
          )}
          <h2 id={headingId} className="break-words text-h2 font-bold tracking-snug text-ink">
            {title}
          </h2>
        </div>
        {!isLoading && !isError && visible.length > 0 && (
          <div className="hidden shrink-0 gap-1 lg:flex">
            <button type="button" aria-label="Previous" onClick={() => scrollBy(-1)} className={arrowClass}>
              <ChevronDownIcon className="h-4 w-4 rotate-90" />
            </button>
            <button type="button" aria-label="Next" onClick={() => scrollBy(1)} className={arrowClass}>
              <ChevronDownIcon className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        )}
      </div>

      {isError ? (
        <div className="flex items-center gap-3 text-body-sm text-text-muted">
          <span>Couldn&apos;t load this section.</span>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-sm px-2 py-1 font-semibold text-volt-600 hover:bg-surface-100"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <ul className="flex gap-4 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="w-44 shrink-0 sm:w-52">
              <div className="aspect-square animate-pulse rounded-md bg-surface-100" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded-sm bg-surface-100" />
              <div className="mt-1 h-4 w-1/3 animate-pulse rounded-sm bg-surface-100" />
            </li>
          ))}
        </ul>
      ) : (
        <ul
          ref={scrollerRef}
          aria-label={`${title}, carousel`}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visible.map((p) => (
            <li key={p.id} className="w-44 shrink-0 snap-start sm:w-52">
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
