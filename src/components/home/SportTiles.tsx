"use client";

import Link from "next/link";
import { useId } from "react";
import { useCategoryTree } from "@/lib/api/hooks/categories";
import type { CategoryNode } from "@/lib/api/schemas/categories";

/**
 * Shop by Sport (home §5, §13.6, AC4). Two large editorial tiles (Football /
 * Cricket) selected from the live category tree by slug. The tree carries
 * id/name/slug only — no image or "sport" flag — so each tile renders a lifestyle
 * image-slot placeholder + ink scrim + display-lg sport name + ghost CTA →
 * `/c/<slug>`. Single published sport → full-width; neither → band omitted.
 *
 * DATA GAP (flagged): a "sport tile image" field is a future CAT/CMS addition.
 * Design source: docs/design/design-files/ui_kits/landing/LpSportTiles.jsx
 */

// Match the top-level sport nodes by slug (or a name fallback).
const SPORT_SLUGS: { match: RegExp; label: string }[] = [
  { match: /football|soccer|ফুটবল/i, label: "Football" },
  { match: /cricket|ক্রিকেট/i, label: "Cricket" },
];

export function SportTiles() {
  const headingId = useId();
  const { data, isLoading } = useCategoryTree();

  const sports = (data ?? [])
    .map((node) => {
      const hit = SPORT_SLUGS.find(
        (s) => s.match.test(node.slug) || s.match.test(node.name),
      );
      return hit ? { node, label: node.name || hit.label } : null;
    })
    .filter((x): x is { node: CategoryNode; label: string } => x !== null)
    .slice(0, 2);

  if (isLoading) {
    return (
      <section aria-labelledby={headingId} className="py-section-y sm:py-10">
        <h2 id={headingId} className="sr-only">
          Shop by Sport
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="aspect-[16/9] animate-pulse rounded-lg bg-surface-100" />
          ))}
        </div>
      </section>
    );
  }

  // Empty / no recognisable sport → omit the band.
  if (sports.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="py-section-y sm:py-10">
      <h2 id={headingId} className="sr-only">
        Shop by Sport
      </h2>
      <div
        className={
          "grid gap-4 " + (sports.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")
        }
      >
        {sports.map(({ node, label }) => (
          <Link
            key={node.id}
            href={`/c/${node.slug}`}
            className="group relative flex aspect-[16/9] items-end overflow-hidden rounded-lg bg-ink"
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink transition-transform duration-slow ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-scrim" aria-hidden="true" />
            <div className="relative flex w-full flex-col items-start gap-3 p-6 sm:p-8">
              <span className="break-words text-display-lg font-extrabold tracking-tight text-white">
                {label}
              </span>
              <span className="inline-flex h-11 items-center rounded-md border border-white/40 px-5 text-body-sm font-semibold text-white transition-colors duration-micro ease-out group-hover:bg-white/10">
                Shop {label} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
