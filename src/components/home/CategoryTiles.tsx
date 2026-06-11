"use client";

import Link from "next/link";
import { useId } from "react";
import { useCategoryTree } from "@/lib/api/hooks/categories";

/**
 * Shop by Category (home §5, §6, AC5) — reskinned to the landing kit's
 * "find your team" tiles (LpCategoryGrid): full-bleed photo tiles in a 2 → 3 → 5
 * grid, each a portrait card with a diagonal fabric texture, a bottom scrim, a
 * white name chip, and a gentle hover zoom. Tile → `/c/<slug>` PLP. Keeps the
 * live loading skeleton, section error + Retry, and empty-tree → omit.
 *
 * DATA GAP (flagged, not invented): the published category tree carries
 * id/name/slug only — no image and no Bangla name. So each tile renders an
 * on-brand colour-tinted placeholder (cycled palette) instead of a real photo,
 * and the chip shows the English name only. Real category imagery + bn labels
 * are a future CAT/CMS field; the tile structure is ready for them.
 *
 * Design source: docs/design/design-files/ui_kits/landing/LpCategoryGrid.jsx
 */

// On-brand tile tints (jersey royal, ink, cricket green, teal, slate, deep red).
// Full literal class strings so Tailwind's JIT emits them (it can't from runtime
// interpolation); cycled by index as a stand-in for per-category photography.
const TILE_TINTS = [
  "bg-[#1E3A8A]",
  "bg-[#15181F]",
  "bg-[#0E7C4F]",
  "bg-[#0E6E86]",
  "bg-[#3B4654]",
  "bg-[#B01722]",
];

const FABRIC =
  "bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.06)_0_2px,rgba(255,255,255,0)_2px_7px)]";
const TILE_SCRIM = "bg-[linear-gradient(to_top,rgba(15,17,21,0.5)_0%,rgba(15,17,21,0)_42%)]";

export function CategoryTiles() {
  const headingId = useId();
  const { data, isLoading, isError, refetch } = useCategoryTree();

  if (!isLoading && !isError && (!data || data.length === 0)) return null;

  return (
    <section aria-labelledby={headingId} className="py-section-y sm:py-10">
      <div className="mb-6 flex flex-col gap-1.5">
        <span className="text-label font-semibold uppercase tracking-[0.1em] text-volt-600">
          Shop by category
        </span>
        <h2 id={headingId} className="text-h2 font-bold tracking-snug text-ink">
          Find your kit
        </h2>
      </div>

      {isError ? (
        <div className="flex items-center gap-3 text-body-sm text-text-muted">
          <span>Couldn&apos;t load this section.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-sm px-2 py-1 font-semibold text-volt-600 hover:bg-surface-100"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="aspect-[4/5] animate-pulse rounded-md bg-surface-100" />
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data!.map((cat, i) => (
            <li key={cat.id}>
              <Link
                href={`/c/${cat.slug}`}
                aria-label={`Shop ${cat.name}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-md bg-ink-700 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
              >
                {/* Colour-tinted media placeholder (data gap: no category image yet). */}
                <span
                  aria-hidden="true"
                  className={
                    "absolute inset-0 transition-transform duration-ui ease-out group-hover:scale-105 motion-reduce:transform-none " +
                    TILE_TINTS[i % TILE_TINTS.length]
                  }
                />
                {/* Diagonal fabric texture so the flat fill reads as kit. */}
                <span aria-hidden="true" className={"pointer-events-none absolute inset-0 opacity-50 " + FABRIC} />
                {/* Bottom scrim under the chip. */}
                <span aria-hidden="true" className={"pointer-events-none absolute inset-0 " + TILE_SCRIM} />
                {/* Name chip, bottom-left. */}
                <span className="absolute bottom-2.5 left-2.5 max-w-[calc(100%-20px)] rounded-md bg-white px-3 py-1.5 shadow-[0_1px_3px_rgba(15,17,21,0.18)] transition-shadow duration-ui ease-out group-hover:shadow-pop">
                  <span className="line-clamp-2 break-words text-body-sm font-bold leading-tight tracking-snug text-ink">
                    {cat.name}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
