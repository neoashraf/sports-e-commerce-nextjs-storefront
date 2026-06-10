"use client";

import Link from "next/link";
import { useId } from "react";
import { useCategoryTree } from "@/lib/api/hooks/categories";

/**
 * Category tiles (home §5, §6, AC5). Top-level entries from the published
 * category tree; tile → `/c/<slug>` PLP. Name-only fallback when a category has
 * no image (the tree from the shell hook carries id/name/slug only — image is a
 * future field, so MVP renders name-only tiles). Loading skeleton + section
 * error + Retry; empty tree → region omitted.
 */
export function CategoryTiles() {
  const headingId = useId();
  const { data, isLoading, isError, refetch } = useCategoryTree();

  if (!isLoading && !isError && (!data || data.length === 0)) return null;

  return (
    <section aria-labelledby={headingId} className="py-section-y sm:py-10">
      <div className="mb-6 flex flex-col gap-1.5">
        <span className="text-label font-semibold uppercase tracking-wide text-volt-600">
          Find your kit
        </span>
        <h2 id={headingId} className="text-h2 font-bold tracking-snug text-ink">
          Shop by Category
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
            <li key={i} className="aspect-[4/3] animate-pulse rounded-lg bg-surface-100" />
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data!.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/c/${cat.slug}`}
                className="group flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-50 px-3 text-center transition-colors duration-micro ease-out hover:bg-surface-100"
              >
                <span className="line-clamp-3 break-words text-body-sm font-semibold text-ink transition-colors duration-micro ease-out group-hover:text-volt-600">
                  {cat.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
