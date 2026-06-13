"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useListing, isNotFound } from "@/lib/api/hooks/search";
import type { ListingProduct } from "@/lib/api/schemas/search";
import {
  parseListingState,
  parseFacetSelection,
  applyFacetSelection,
  toApiParams,
  mutateSearch,
  type SortValue,
} from "@/lib/listing/url-state";
import { formatBDT } from "@/lib/format";
import { ActiveFilterChips, type Chip } from "./ActiveFilterChips";
import { ProductGrid } from "./ProductGrid";
import { ListingSkeleton } from "./ListingSkeleton";
import { Pagination } from "./Pagination";
import { SubcategoryStrip } from "./SubcategoryStrip";
import { FilterPanel } from "@/components/filter/FilterPanel";
import { ZeroResultRecovery } from "@/components/search/ZeroResultRecovery";
import { Icon } from "@/components/ui/Icon";

/**
 * The shared PLP — renders both category browse (`/c/<slug>`) and search
 * (`/search?q=`) (search-listing-fe). URL is the single source of truth for
 * filter/sort/page; mutations push a new querystring (scroll preserved). Owns
 * the result header, sort, chips, grid, pagination, and every §6 state. The
 * facet panel + search box are the sibling search-filter-fe.
 */
const LIMIT = 24;

export function ProductListing({
  scope,
}: {
  scope: { kind: "category"; slug: string } | { kind: "search"; query: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSearch = scope.kind === "search";

  const state = useMemo(
    () => parseListingState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const defaultSort: SortValue = isSearch ? "relevance" : "best_selling";
  const sort = state.sort ?? defaultSort;

  // Accumulated products across "Load more" pages (mobile). Numbered pager replaces.
  const [extraPages, setExtraPages] = useState<ListingProduct[]>([]);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const facetSelection = useMemo(
    () => parseFacetSelection(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const apiParams = useMemo(
    () => toApiParams({ ...state, sort }, LIMIT),
    [state, sort],
  );
  const { data, isLoading, isFetching, isError, error, refetch } = useListing(scope, apiParams);

  function pushState(fn: (sp: URLSearchParams) => void) {
    const next = mutateSearch(new URLSearchParams(searchParams.toString()), fn);
    setExtraPages([]); // a sort/filter change resets accumulation
    router.push(`${pathname}${next}`, { scroll: false });
  }

  function onSort(newSort: SortValue) {
    pushState((sp) => {
      sp.set("sort", newSort);
      sp.set("page", "1");
    });
  }

  function goToPage(page: number) {
    pushState((sp) => sp.set("page", String(page)));
  }

  function loadMore() {
    // Append the current page's products, then bump page in the URL.
    if (data) setExtraPages((prev) => [...prev, ...data.data.products]);
    const next = mutateSearch(new URLSearchParams(searchParams.toString()), (sp) =>
      sp.set("page", String(state.page + 1)),
    );
    router.push(`${pathname}${next}`, { scroll: false });
  }

  // ---- 404 (category not found) ----
  if (isError && isNotFound(error)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-h1 font-bold text-ink">This category isn&apos;t available.</h1>
        <Link href="/search" className="inline-flex h-11 items-center rounded-md bg-volt px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600">
          Browse all products
        </Link>
      </div>
    );
  }

  const products = [...extraPages, ...(data?.data.products ?? [])];
  const total = data?.meta.total ?? 0;
  const chips = data ? buildChips(data.data.applied_filters) : [];
  const facets = data?.data.facets ?? [];
  const recovery = isSearch && products.length === 0 ? data?.data.suggestions : null;

  function commitFacets(next: Parameters<typeof applyFacetSelection>[1]) {
    const qs = applyFacetSelection(new URLSearchParams(searchParams.toString()), next).toString();
    setExtraPages([]);
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }
  const activeFacetCount =
    Object.values(facetSelection.terms).reduce((n, v) => n + v.length, 0) +
    (facetSelection.priceMin || facetSelection.priceMax ? 1 : 0) +
    Object.values(facetSelection.booleans).filter(Boolean).length;

  const title = isSearch
    ? total > 0
      ? `${total} results for ‘${scope.query}’`
      : `No results for ‘${scope.query}’`
    : data?.data.scope.title ?? scope.slug;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Result header */}
      <div className="mb-3">
        {!isSearch && data?.data.scope.breadcrumb && (
          <nav aria-label="Breadcrumb" className="mb-1">
            <ol className="flex flex-wrap items-center gap-1 text-body-sm text-text-muted">
              {data.data.scope.breadcrumb.map((c, i, arr) => {
                const isLast = i === arr.length - 1;
                return (
                  <li key={`${c}-${i}`} className="flex items-center gap-1">
                    {i > 0 && <span aria-hidden="true">›</span>}
                    {/* breadcrumb is name-only (no slug on the payload) — current crumb
                        is marked aria-current; intermediate crumbs render as plain text
                        until the scope payload carries crumb slugs (flagged). */}
                    <span className="break-words" aria-current={isLast ? "page" : undefined}>
                      {c}
                    </span>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        <h1 className="break-words text-h1 font-bold tracking-snug text-ink">{title}</h1>
      </div>

      {/* Subcategory tab strip (category scope only; omitted on search / leaf) */}
      {!isSearch && <SubcategoryStrip activeSlug={scope.slug} />}

      {/* Sticky control bar: result count (aria-live) + single Filter & Sort button */}
      <div className="sticky top-[60px] z-20 -mx-4 mb-3 flex items-center justify-between gap-3 border-b border-border bg-white/90 px-4 py-2 backdrop-blur-md sm:top-[64px]">
        <p className="text-body-sm text-text-muted" aria-live="polite">
          {total} {total === 1 ? "product" : "products"}
        </p>
        <button
          type="button"
          onClick={() => setFilterDrawerOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-border-strong px-4 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
        >
          Filter &amp; Sort
          {activeFacetCount > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-volt px-1 text-[11px] font-bold text-ink">
              {activeFacetCount}
            </span>
          )}
        </button>
      </div>

      {/* Chips */}
      {chips.length > 0 && (
        <div className="mb-4">
          <ActiveFilterChips
            chips={chips}
            onRemove={(chip) =>
              pushState((sp) => {
                const remaining = sp.getAll(chip.key).filter((v) => v !== chip.value);
                sp.delete(chip.key);
                remaining.forEach((v) => sp.append(chip.key, v));
                sp.set("page", "1");
              })
            }
            onClearAll={() =>
              pushState((sp) => {
                for (const key of Array.from(new Set(sp.keys()))) {
                  if (!["q", "sort"].includes(key)) sp.delete(key);
                }
                sp.set("page", "1");
              })
            }
          />
        </div>
      )}

      {/* Filter & Sort drawer (right on desktop, bottom sheet on mobile) + grid */}
      <FilterPanel
        facets={facets}
        selection={facetSelection}
        sort={sort}
        isSearch={isSearch}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onCommit={commitFacets}
        onSortChange={onSort}
        drawerOpen={filterDrawerOpen}
        onCloseDrawer={() => setFilterDrawerOpen(false)}
        activeCount={activeFacetCount}
      />

      <div>
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <ListingSkeleton />
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-body font-medium text-ink">Couldn&apos;t load products.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex h-11 items-center rounded-md bg-volt px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
              >
                Try again
              </button>
            </div>
          ) : products.length === 0 ? (
            recovery ? (
              <ZeroResultRecovery
                query={isSearch ? scope.query : ""}
                relaxedQuery={recovery.relaxed_query ?? null}
                restrictingFilters={recovery.restricting_filters ?? []}
                popularCategories={recovery.popular_categories ?? []}
                onRelax={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
                onRemoveFilter={(key, value) =>
                  pushState((sp) => {
                    const remaining = sp.getAll(key).filter((v) => v !== value);
                    sp.delete(key);
                    remaining.forEach((v) => sp.append(key, v));
                    sp.set("page", "1");
                  })
                }
              />
            ) : (
              <EmptyState
                isSearch={isSearch}
                query={isSearch ? scope.query : undefined}
                page={state.page}
                onClearAll={() =>
                  pushState((sp) => {
                    for (const key of Array.from(new Set(sp.keys()))) {
                      if (!["q", "sort"].includes(key)) sp.delete(key);
                    }
                  })
                }
                onBackToPage1={() => goToPage(1)}
              />
            )
          ) : (
            <div className="relative">
              {/* Refine overlay — a filter/sort/page refine of an already-loaded grid keeps
                  the grid mounted + visible (no unmount, no scroll reset), dims it, and shows
                  a kept-visible "Updating…" cue. First-load skeleton is handled by isLoading above. */}
              <div
                className={
                  "transition-opacity duration-ui ease-out motion-reduce:transition-none " +
                  (isFetching && !isLoading ? "opacity-50" : "opacity-100")
                }
                aria-busy={isFetching && !isLoading}
              >
                <ProductGrid products={products} />
                <Pagination
                  page={state.page}
                  limit={LIMIT}
                  total={total}
                  shown={products.length}
                  onGoTo={goToPage}
                  onLoadMore={loadMore}
                />
              </div>
              {isFetching && !isLoading && (
                <div className="pointer-events-none absolute inset-0 top-0 flex justify-center" aria-hidden="true">
                  <span className="sticky top-24 mt-8 inline-flex h-fit items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-body-sm font-semibold text-ink shadow-card">
                    <Icon name="loader" size={16} className="animate-spin motion-reduce:animate-none" />
                    Updating…
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Empty states: category zero-result, search zero-result, out-of-range page. */
function EmptyState({
  isSearch,
  query,
  page,
  onClearAll,
  onBackToPage1,
}: {
  isSearch: boolean;
  query?: string;
  page: number;
  onClearAll: () => void;
  onBackToPage1: () => void;
}) {
  if (page > 1) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-body text-text-muted">No more products on this page.</p>
        <button type="button" onClick={onBackToPage1} className="text-body-sm font-semibold text-volt-600 hover:underline">
          Back to page 1
        </button>
      </div>
    );
  }
  if (isSearch) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-body font-medium text-ink">No results for ‘{query}’</p>
        <p className="text-body-sm text-text-muted">Try a different search or browse our categories.</p>
        <Link href="/" className="text-body-sm font-semibold text-volt-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-body font-medium text-ink">No products match your filters.</p>
      <button type="button" onClick={onClearAll} className="text-body-sm font-semibold text-volt-600 hover:underline">
        Clear all filters
      </button>
    </div>
  );
}

/** Turn `applied_filters` into removable chips. */
function buildChips(applied: Record<string, unknown>): Chip[] {
  const chips: Chip[] = [];
  for (const [key, val] of Object.entries(applied)) {
    if (val == null) continue;
    if (key === "price" && typeof val === "object") {
      const range = val as { min?: string; max?: string };
      const min = range.min ? formatBDT(Number(range.min)) : "";
      const max = range.max ? formatBDT(Number(range.max)) : "";
      chips.push({ key: "price", value: `${range.min ?? ""}-${range.max ?? ""}`, label: `${min}–${max}` });
    } else if (typeof val === "boolean") {
      if (val) chips.push({ key, value: "true", label: key === "in_stock" ? "In stock" : key === "on_sale" ? "On sale" : key });
    } else if (Array.isArray(val)) {
      for (const v of val) {
        chips.push({ key, value: String(v), label: `${capitalize(key)}: ${String(v)}` });
      }
    }
  }
  return chips;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
