"use client";

import { useId, useRef } from "react";
import type { ListingProduct } from "@/lib/api/schemas/search";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ChevronDownIcon } from "@/components/shell/icons";

/**
 * Home product carousel (home §5, §6, §10, AC3/AC9). A labelled, horizontally
 * scrollable region with real prev/next buttons. Renders its own loading
 * skeleton and section-error (+ "Retry") state; an empty section is OMITTED by
 * the caller (this returns null when not loading/error and items is empty).
 */
export function HomeCarousel({
  title,
  items,
  isLoading,
  isError,
  onRetry,
}: {
  title: string;
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

  // Omit an empty, settled section entirely.
  if (!isLoading && !isError && items.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 id={headingId} className="break-words text-lg font-semibold text-gray-900">
          {title}
        </h2>
        {!isLoading && !isError && items.length > 0 && (
          <div className="hidden gap-1 lg:flex">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => scrollBy(-1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <ChevronDownIcon className="h-4 w-4 rotate-90" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => scrollBy(1)}
              className="grid h-9 w-9 place-items-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <ChevronDownIcon className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        )}
      </div>

      {isError ? (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>Couldn&apos;t load this section.</span>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md px-2 py-1 font-medium text-brand-600 hover:bg-brand-50"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <ul className="flex gap-4 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="w-40 shrink-0 sm:w-48">
              <div className="aspect-square animate-pulse rounded-lg bg-gray-100" />
              <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-gray-100" />
              <div className="mt-1 h-4 w-1/3 animate-pulse rounded bg-gray-100" />
            </li>
          ))}
        </ul>
      ) : (
        <ul
          ref={scrollerRef}
          aria-label={`${title}, carousel`}
          className="flex gap-4 overflow-x-auto pb-2"
        >
          {items.map((p) => (
            <li key={p.id} className="w-40 shrink-0 sm:w-48">
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
