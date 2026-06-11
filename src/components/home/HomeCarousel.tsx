"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { ListingProduct } from "@/lib/api/schemas/search";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ChevronDownIcon } from "@/components/shell/icons";

/**
 * Home product carousel (home §5, §6, §10, AC5/AC9) — reskinned to the landing
 * kit (LpCarousel + LPRail): an eyebrow + title header with a "View all →" link,
 * a scroll-snap rail with a ~1.5-card mobile peek, and square edge arrows that
 * fade in on row hover/focus and disable at the start/end. Renders its own
 * loading skeleton and section-error (+ "Retry"). OOS items are hidden
 * (home §13.2); an empty settled section is OMITTED (returns null).
 *
 * Cards use the minimal (heart-less) ProductCard — same as the PDP "complete the
 * look" rail — keeping carousels denser than the PLP grid. The card's own
 * hover-reveal "Choose size" quick action is the rail's add affordance.
 *
 * Design source: docs/design/design-files/ui_kits/landing/LpCarousel.jsx
 */
export function HomeCarousel({
  id,
  title,
  eyebrow,
  items,
  viewAllHref = "/search",
  isLoading,
  isError,
  onRetry,
}: {
  id?: string;
  title: string;
  eyebrow?: string;
  items: ListingProduct[];
  viewAllHref?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}) {
  const headingId = useId();
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Hide out-of-stock items from the rail (home §13.2).
  const visible = items.filter((p) => p.availability !== "out_of_stock");

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 1);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateEdges();
    const onResize = () => updateEdges();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateEdges, visible.length]);

  function scrollByDir(dir: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  // Omit an empty, settled section entirely.
  if (!isLoading && !isError && visible.length === 0) return null;

  const arrowClass =
    "absolute top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-sm border border-ink bg-white text-ink shadow-[0_2px_10px_rgba(15,17,21,0.14)] opacity-0 transition-[opacity,background,color] duration-micro ease-out " +
    "pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 " +
    "hover:border-ink hover:bg-ink hover:text-volt focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:!opacity-0";

  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-24 py-section-y sm:py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          {eyebrow && (
            <span className="text-label font-semibold uppercase tracking-[0.1em] text-volt-600">
              {eyebrow}
            </span>
          )}
          <h2 id={headingId} className="break-words text-h2 font-bold tracking-snug text-ink">
            {title}
          </h2>
        </div>
        {!isError && (
          <Link
            href={viewAllHref}
            className="shrink-0 whitespace-nowrap text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:text-volt-600 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
          >
            View all <span aria-hidden="true">→</span>
          </Link>
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
        // `group` drives the edge-arrow reveal on hover/focus; the scroller carries
        // vertical padding so the card hover-lift shadow isn't clipped by overflow.
        <div className="group relative">
          <ul
            ref={scrollerRef}
            onScroll={updateEdges}
            aria-label={`${title}, carousel`}
            className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {visible.map((p) => (
              <li key={p.id} className="w-44 shrink-0 snap-start sm:w-52">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>

          {/* Edge arrows — hover-only (never appear on touch), disabled at edges. */}
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByDir(-1)}
            disabled={!canPrev}
            className={arrowClass + " left-0"}
          >
            <ChevronDownIcon className="h-5 w-5 rotate-90" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByDir(1)}
            disabled={!canNext}
            className={arrowClass + " right-0"}
          >
            <ChevronDownIcon className="h-5 w-5 -rotate-90" />
          </button>
        </div>
      )}
    </section>
  );
}
