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
      <h2 className="text-h3 font-bold text-ink">No results for ‘{query}’</h2>

      {relaxedQuery && (
        <button
          type="button"
          onClick={() => onRelax(relaxedQuery)}
          className="mt-3 inline-flex items-center rounded-full bg-volt px-4 py-2 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
        >
          Did you mean ‘{relaxedQuery}’?
        </button>
      )}

      {restrictingFilters.length > 0 && (
        <div className="mt-5">
          <p className="text-body-sm text-text-muted">Try removing a filter:</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {restrictingFilters.map((f) => (
              <button
                key={`${f.key}:${f.value}`}
                type="button"
                onClick={() => onRemoveFilter(f.key, f.value)}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-full border border-border-strong px-3 py-1.5 text-body-sm text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
              >
                Remove: {f.label} <span aria-hidden="true">✕</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {popularCategories.length > 0 && (
        <div className="mt-8">
          <p className="text-body-sm font-semibold text-ink">Popular categories</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {popularCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/c/${c.slug}`}
                className="rounded-md border border-border px-4 py-3 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:border-volt-600 hover:text-volt-600"
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
