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
    <section aria-labelledby={headingId} className="py-6">
      <h2 id={headingId} className="mb-4 text-lg font-semibold text-gray-900">
        Shop by Category
      </h2>

      {isError ? (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>Couldn&apos;t load this section.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md px-2 py-1 font-medium text-brand-600 hover:bg-brand-50"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="aspect-[4/3] animate-pulse rounded-lg bg-gray-100" />
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {data!.map((cat) => (
            <li key={cat.id}>
              <Link
                href={`/c/${cat.slug}`}
                className="flex aspect-[4/3] items-center justify-center rounded-lg bg-gray-100 px-3 text-center text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                <span className="line-clamp-3 break-words">{cat.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
