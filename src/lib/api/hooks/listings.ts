"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  listingResponseSchema,
  type ListingResponse,
} from "@/lib/api/schemas/search";

/**
 * Storefront listing hooks (docs/api-contracts/03-search-browse.md). Public.
 *
 * New Arrivals reads a listing sorted `sort=newest` (FR-CAT-018 via the
 * `newest` sort). There is no dedicated "all products newest" path in the
 * contract; this uses the keyword-search endpoint with an empty query +
 * `sort=newest`, which returns the newest catalogue page. Flagged in the PR as
 * the New-Arrivals source until a dedicated endpoint lands.
 */
export const listingKeys = {
  newest: (limit: number) => ["listings", "newest", limit] as const,
  category: (slug: string, params: Record<string, unknown>) =>
    ["listings", "category", slug, params] as const,
};

export function useNewArrivals(limit = 12) {
  return useQuery({
    queryKey: listingKeys.newest(limit),
    queryFn: ({ signal }): Promise<ListingResponse> =>
      api.get("/search", {
        schema: listingResponseSchema,
        public: true,
        params: { sort: "newest", limit, page: 1 },
        signal,
      }) as Promise<ListingResponse>,
    staleTime: 2 * 60_000,
    retry: 1,
  });
}
