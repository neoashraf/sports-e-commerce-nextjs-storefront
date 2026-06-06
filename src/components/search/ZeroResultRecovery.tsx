"use client";

import Link from "next/link";

/**
 * Zero-result recovery block (search-autosuggest.md §5, search-filter-fe AC7).
 * Renders in the search results empty slot: a relaxed-query "Did you mean" chip,
 * removable restricting-filter chips, and popular-category cards.
 */
export function ZeroResultRecovery({
  query,
  relaxedQuery,
  restrictingFilters,
  popularCategories,
  onRelax,
  onRemoveFilter,
}: {
  query: string;
  relaxedQuery: string | null;
  restrictingFilters: { key: string; value: string; label: string }[];
  popularCategories: { slug: string; title: string }[];
  onRelax: (q: string) => void;
  onRemoveFilter: (key: string, value: string) => void;
}) {
  return (
    <div className="py-12 text-center">
      <h2 className="text-base font-semibold text-gray-800">No results for ‘{query}’</h2>

      {relaxedQuery && (
        <button
          type="button"
          onClick={() => onRelax(relaxedQuery)}
          className="mt-3 inline-flex items-center rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          Did you mean ‘{relaxedQuery}’?
        </button>
      )}

      {restrictingFilters.length > 0 && (
        <div className="mt-5">
          <p className="text-sm text-gray-500">Try removing a filter:</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {restrictingFilters.map((f) => (
              <button
                key={`${f.key}:${f.value}`}
                type="button"
                onClick={() => onRemoveFilter(f.key, f.value)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Remove: {f.label} <span aria-hidden="true">✕</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {popularCategories.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-medium text-gray-700">Popular categories</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {popularCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/c/${c.slug}`}
                className="rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-800 hover:border-gray-400"
              >
                {c.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
