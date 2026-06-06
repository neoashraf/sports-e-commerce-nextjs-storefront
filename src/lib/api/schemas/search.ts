import { z } from "zod";

/**
 * Zod schemas for the storefront listing/search responses
 * (GET /api/v1/listings/..., /api/v1/search — docs/api-contracts/03-search-browse.md).
 *
 * The `listingProductSchema` is the source shape for the shared SRCH/PLP product
 * card (reused on the home carousels and search results). Money fields are
 * decimal strings on the wire.
 */

export const availabilitySchema = z.enum(["in_stock", "low_stock", "out_of_stock"]);
export type Availability = z.infer<typeof availabilitySchema>;

export const listingProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  brand: z.string().nullable().optional(),
  primary_image: z.string().nullable().optional(),
  effective_price: z.string(),
  base_price: z.string().optional(),
  on_sale: z.boolean().default(false),
  is_new: z.boolean().optional(),
  currency: z.string().default("BDT"),
  availability: availabilitySchema.default("in_stock"),
});
export type ListingProduct = z.infer<typeof listingProductSchema>;

export const listingScopeSchema = z.object({
  type: z.string(),
  slug: z.string().optional(),
  title: z.string().optional(),
  query: z.string().optional(),
  breadcrumb: z.array(z.string()).optional(),
});

export const facetValueSchema = z.object({
  value: z.string(),
  label: z.string(),
  count: z.number().optional(),
  color_hex: z.string().optional(),
});

export const facetSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["term", "range", "boolean"]),
  multi_select: z.boolean().optional(),
  values: z.array(facetValueSchema).optional(),
  min: z.string().optional(),
  max: z.string().optional(),
  count: z.number().optional(),
});
export type Facet = z.infer<typeof facetSchema>;

export const listingResponseSchema = z.object({
  scope: listingScopeSchema,
  products: z.array(listingProductSchema).default([]),
  facets: z.array(facetSchema).default([]),
  applied_filters: z.record(z.unknown()).default({}),
  sort: z.string().optional(),
  redirect: z
    .object({ target_type: z.string(), target_ref: z.string() })
    .nullable()
    .optional(),
  suggestions: z.unknown().nullable().optional(),
});
export type ListingResponse = z.infer<typeof listingResponseSchema>;
