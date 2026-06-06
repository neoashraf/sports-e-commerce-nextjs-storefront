"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import {
  listingResponseSchema,
  suggestResponseSchema,
  type ListingResponse,
  type SuggestResponse,
} from "@/lib/api/schemas/search";

/**
 * Listing + search hooks (docs/api-contracts/03-search-browse.md) for the PLP
 * (search-listing-fe). Both are public, keyed on the full URL state, and keep
 * previous data on refine so the grid doesn't blank between pages/filters.
 *
 * The platform `{ data, meta }` envelope is unwrapped by the client to `data`;
 * pagination `meta` is fetched separately via the raw envelope when needed —
 * here the hooks request `withMeta` so callers get both.
 */

export interface ListingMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ListingResult {
  data: ListingResponse;
  meta: ListingMeta;
}

export const searchKeys = {
  category: (slug: string, qs: string) => ["listing", "category", slug, qs] as const,
  search: (qs: string) => ["listing", "search", qs] as const,
};

/** Fetch the listing preserving the envelope `meta` (page/limit/total). */
async function fetchListing(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
  signal?: AbortSignal,
): Promise<ListingResult> {
  const res = await api.getWithMeta(path, {
    schema: listingResponseSchema,
    public: true,
    params,
    signal,
  });
  const data = res.data as ListingResponse;
  const meta = res.meta;
  const page = Number((meta?.page as number) ?? params.page ?? 1) || 1;
  const limit = Number((meta?.limit as number) ?? params.limit ?? 24) || 24;
  const total = Number((meta?.total as number) ?? data.products.length) || data.products.length;
  return { data, meta: { page, limit, total } };
}

export function useListing(
  scope: { kind: "category"; slug: string } | { kind: "search"; query: string },
  params: Record<string, string | number | boolean | undefined>,
) {
  const qs = JSON.stringify(params);
  const isCategory = scope.kind === "category";
  const path = isCategory
    ? `/listings/category/${encodeURIComponent(scope.slug)}`
    : "/search";
  const queryKey = isCategory
    ? searchKeys.category(scope.slug, qs)
    : searchKeys.search(qs);

  return useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      fetchListing(
        path,
        isCategory ? params : { ...params, q: scope.query },
        signal,
      ),
    placeholderData: keepPreviousData,
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return count < 2;
    },
    staleTime: 30_000,
  });
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/**
 * Debounced autosuggest (search-filter-fe). Only fetches at >=2 chars; fails
 * silently (degrades to recent searches) — errors don't surface as UI.
 */
export const suggestKeys = { suggest: (q: string) => ["suggest", q] as const };

export function useSuggest(query: string) {
  const q = query.trim();
  const enabled = q.length >= 2;
  return useQuery({
    queryKey: suggestKeys.suggest(q),
    enabled,
    queryFn: ({ signal }): Promise<SuggestResponse> =>
      api.get("/search/suggest", {
        schema: suggestResponseSchema,
        public: true,
        params: { q },
        signal,
      }) as Promise<SuggestResponse>,
    staleTime: 30_000,
    retry: false,
  });
}
