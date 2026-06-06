"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import {
  productDetailSchema,
  type ProductDetail,
  type Variant,
} from "@/lib/api/schemas/catalog";

/**
 * GET /products/{slug} — the storefront product-detail payload that drives the
 * PDP (catalog-product-detail-fe). Public (no token). A `404` is surfaced as an
 * ApiError(404) so the page can render the not-found state without retrying.
 */
export const catalogKeys = {
  product: (slug: string) => ["product", slug] as const,
};

export function useProductDetail(slug: string) {
  return useQuery({
    queryKey: catalogKeys.product(slug),
    queryFn: ({ signal }): Promise<ProductDetail> =>
      api.get(`/products/${encodeURIComponent(slug)}`, {
        schema: productDetailSchema,
        public: true,
        signal,
      }) as Promise<ProductDetail>,
    // Don't retry a 404 (deliberate — §6 not-found has no retry).
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return count < 2;
    },
    staleTime: 60_000,
  });
}

/** True when the query failed specifically because the product wasn't found. */
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/**
 * Resolve the concrete variant for a set of chosen option ids (e.g.
 * { color: "o-black", size: "o-42" }). Returns undefined until every
 * configurable attribute has a selection that matches a variant row.
 */
export function resolveVariant(
  product: ProductDetail,
  selected: Record<string, string>,
): Variant | undefined {
  const codes = product.configurable_attributes.map((a) => a.code);
  // Every configurable attribute must have a selection.
  if (codes.some((c) => !selected[c])) return undefined;
  return product.variants.find((v) =>
    codes.every((c) => v.options[c] === selected[c]),
  );
}

/**
 * For a given color selection, which size option ids are sellable (a variant
 * exists for color×size that is non-out_of_stock). Used to disable dead sizes.
 */
export function sellableSizeIds(
  product: ProductDetail,
  colorCode: string | null,
  selectedColor: string | null,
  sizeCode: string,
): Set<string> {
  const ids = new Set<string>();
  for (const v of product.variants) {
    if (colorCode && selectedColor && v.options[colorCode] !== selectedColor) continue;
    if (v.stock_status === "out_of_stock") continue;
    const sizeId = v.options[sizeCode];
    if (sizeId) ids.add(sizeId);
  }
  return ids;
}
