"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { listingProductSchema, type ListingProduct } from "@/lib/api/schemas/search";

/**
 * Storefront homepage product rails — the three dedicated PUBLIC showcase
 * endpoints (no auth):
 *   GET /featured-products?page=&limit=   → "Handpicked" / Featured
 *   GET /new-products                     → "Just dropped" / New Arrivals
 *   GET /best-selling-products            → "Fan favourites" / Best Sellers
 *
 * All three return the SAME card shape (the platform `{ data }` envelope wraps a
 * bare array; featured also carries `meta` pagination which we don't need for a
 * homepage rail). The item shape is identical to `listingProductSchema` (the
 * showcase card omits `is_new`, which is already optional there), so the shared
 * ProductCard renders them unchanged.
 */
const showcaseListSchema = z.array(listingProductSchema);

export const showcaseKeys = {
  featured: (limit: number) => ["showcase", "featured", limit] as const,
  newProducts: ["showcase", "new"] as const,
  bestSelling: ["showcase", "best-selling"] as const,
};

/** Featured / "Handpicked" — paginated; we take the first page for the rail. */
export function useFeaturedProducts(limit = 12) {
  return useQuery({
    queryKey: showcaseKeys.featured(limit),
    queryFn: ({ signal }): Promise<ListingProduct[]> =>
      api.get("/featured-products", {
        schema: showcaseListSchema,
        public: true,
        params: { page: 1, limit },
        signal,
      }) as Promise<ListingProduct[]>,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

/** New Arrivals / "Just dropped" — newest published products (top 20, fixed). */
export function useNewProducts() {
  return useQuery({
    queryKey: showcaseKeys.newProducts,
    queryFn: ({ signal }): Promise<ListingProduct[]> =>
      api.get("/new-products", {
        schema: showcaseListSchema,
        public: true,
        signal,
      }) as Promise<ListingProduct[]>,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

/** Best Sellers / "Fan favourites" — top sellers by units sold (top 20, fixed). */
export function useBestSellingProducts() {
  return useQuery({
    queryKey: showcaseKeys.bestSelling,
    queryFn: ({ signal }): Promise<ListingProduct[]> =>
      api.get("/best-selling-products", {
        schema: showcaseListSchema,
        public: true,
        signal,
      }) as Promise<ListingProduct[]>,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
