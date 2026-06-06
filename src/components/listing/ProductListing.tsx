"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useListing, isNotFound } from "@/lib/api/hooks/search";
import type { ListingProduct } from "@/lib/api/schemas/search";
import {
  parseListingState,
  toApiParams,
  mutateSearch,
  type SortValue,
} from "@/lib/listing/url-state";
import { formatBDT } from "@/lib/format";
import { SortDropdown } from "./SortDropdown";
import { ActiveFilterChips, type Chip } from "./ActiveFilterChips";
import { ProductGrid } from "./ProductGrid";
import { ListingSkeleton } from "./ListingSkeleton";
import { Pagination } from "./Pagination";

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
        <h1 className="text-xl font-semibold text-gray-900">This category isn&apos;t available.</h1>
        <Link href="/search" className="inline-flex h-11 items-center rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800">
          Browse all products
        </Link>
      </div>
    );
  }

  const products = [...extraPages, ...(data?.data.products ?? [])];
  const total = data?.meta.total ?? 0;
  const chips = data ? buildChips(data.data.applied_filters) : [];

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
            <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
              {data.data.scope.breadcrumb.map((c, i) => (
                <li key={`${c}-${i}`} className="flex items-center gap-1">
                  {i > 0 && <span aria-hidden="true">›</span>}
                  <span className="break-words">{c}</span>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="break-words text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
        {!isSearch && (
          <p className="mt-1 text-sm text-gray-500" aria-live="polite">
            {total} products
          </p>
        )}
      </div>

      {/* Sticky control bar */}
      <div className="sticky top-[60px] z-20 -mx-4 mb-3 flex items-center justify-between gap-3 border-b border-gray-100 bg-white/95 px-4 py-2 backdrop-blur sm:top-[64px]">
        <button
          type="button"
          className="inline-flex h-11 items-center gap-1 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          Filter{chips.length > 0 ? ` · ${chips.length}` : ""}
        </button>
        <SortDropdown value={sort} isSearch={isSearch} disabled={isLoading} onChange={onSort} />
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

      {/* Grid + states */}
      {isLoading ? (
        <ListingSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm font-medium text-gray-700">Couldn&apos;t load products.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-10 items-center rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <EmptyState isSearch={isSearch} query={isSearch ? scope.query : undefined} page={state.page} onClearAll={() => pushState((sp) => {
          for (const key of Array.from(new Set(sp.keys()))) {
            if (!["q", "sort"].includes(key)) sp.delete(key);
          }
        })} onBackToPage1={() => goToPage(1)} />
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
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
      )}
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
        <p className="text-sm text-gray-600">No more products on this page.</p>
        <button type="button" onClick={onBackToPage1} className="text-sm font-medium text-brand-600 hover:underline">
          Back to page 1
        </button>
      </div>
    );
  }
  if (isSearch) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-base font-medium text-gray-700">No results for ‘{query}’</p>
        <p className="text-sm text-gray-500">Try a different search or browse our categories.</p>
        <Link href="/" className="text-sm font-medium text-brand-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-base font-medium text-gray-700">No products match your filters.</p>
      <button type="button" onClick={onClearAll} className="text-sm font-medium text-brand-600 hover:underline">
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
