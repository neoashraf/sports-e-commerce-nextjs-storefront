"use client";

/**
 * Pagination (product-listing §5, §8, AC5). Desktop: numbered pager
 * (Previous · 1 2 3 … · Next). Mobile/tablet: "Load more" with "{shown} of
 * {total} shown". Both write `page` to the URL via the caller. `shown` is the
 * running count of products rendered so far (load-more appends).
 */
export function Pagination({
  page,
  limit,
  total,
  shown,
  onGoTo,
  onLoadMore,
}: {
  page: number;
  limit: number;
  total: number;
  shown: number;
  onGoTo: (page: number) => void;
  onLoadMore: () => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (total <= 0) return null;

  const pages = pageWindow(page, totalPages);
  const hasMore = shown < total;

  return (
    <div className="mt-8">
      {/* Mobile / tablet: load more */}
      <div className="flex flex-col items-center gap-2 lg:hidden">
        <p className="text-sm text-gray-500" aria-live="polite">
          {shown} of {total} shown
        </p>
        {hasMore && (
          <button
            type="button"
            onClick={onLoadMore}
            className="inline-flex h-11 items-center rounded-lg border border-gray-300 px-6 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            Load more
          </button>
        )}
      </div>

      {/* Desktop: numbered pager */}
      <nav aria-label="Pagination" className="hidden items-center justify-center gap-1 lg:flex">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onGoTo(page - 1)}
          className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          Previous
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-2 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onGoTo(p)}
              className={
                "grid h-10 w-10 place-items-center rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 " +
                (p === page ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100")
              }
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onGoTo(page + 1)}
          className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          Next
        </button>
      </nav>
    </div>
  );
}

/** A compact page window like [1, …, 4, 5, 6, …, 12]. */
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}
