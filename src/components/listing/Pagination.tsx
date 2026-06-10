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
        <p className="text-body-sm text-text-muted" aria-live="polite">
          {shown} of {total} shown
        </p>
        {hasMore && (
          <button
            type="button"
            onClick={onLoadMore}
            className="inline-flex h-11 items-center rounded-md border border-border-strong px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
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
          className="inline-flex h-10 items-center rounded-md px-3 text-body-sm font-medium text-ink transition-colors duration-micro ease-out hover:bg-surface-100 disabled:opacity-40"
        >
          Previous
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-2 text-text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onGoTo(p)}
              className={
                "grid h-10 w-10 place-items-center rounded-md text-body-sm font-semibold transition-colors duration-micro ease-out " +
                (p === page ? "bg-ink text-white" : "text-ink hover:bg-surface-100")
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
          className="inline-flex h-10 items-center rounded-md px-3 text-body-sm font-medium text-ink transition-colors duration-micro ease-out hover:bg-surface-100 disabled:opacity-40"
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
