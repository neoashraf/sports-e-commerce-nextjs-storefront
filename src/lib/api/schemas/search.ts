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

/**
 * A colourway on the ProductCard swatch rail (RW6). All fields optional so a
 * backend that hasn't shipped them yet still parses; the card omits the rail.
 */
export const cardSwatchSchema = z.object({
  image: z.string(),
  label: z.string().optional().default(""),
  color_hex: z.string().nullable().optional(),
});
export type CardSwatch = z.infer<typeof cardSwatchSchema>;

/** Light text merch label on the card (RW6). */
export const merchLabelSchema = z.enum(["new", "bestSeller", "authentic"]);
export type MerchLabel = z.infer<typeof merchLabelSchema>;

/**
 * The five RW6 product-card data fields (hover image, swatch rail, Bangla name,
 * variant flag, merch label). All optional/nullable so a pre-RW6 payload parses
 * unchanged and the card renders its existing fallbacks. Spread into every
 * card-backing schema (listing/search, home section, related link, wishlist).
 */
export const cardFieldsShape = {
  name_bn: z.string().nullable().optional(),
  hover_image: z.string().nullable().optional(),
  swatches: z.array(cardSwatchSchema).optional().default([]),
  requires_variant: z.boolean().optional().default(false),
  merch_label: merchLabelSchema.nullable().optional(),
} as const;

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
  ...cardFieldsShape,
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

export const suggestResponseSchema = z.object({
  query_suggestions: z.array(z.string()).default([]),
  category_suggestions: z
    .array(z.object({ slug: z.string(), title: z.string() }))
    .default([]),
  product_suggestions: z
    .array(
      z.object({
        id: z.string(),
        slug: z.string(),
        title: z.string(),
        primary_image: z.string().nullable().optional(),
        effective_price: z.string(),
      }),
    )
    .default([]),
});
export type SuggestResponse = z.infer<typeof suggestResponseSchema>;

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
  suggestions: z
    .object({
      relaxed_query: z.string().nullable().optional(),
      popular_categories: z
        .array(z.object({ slug: z.string(), title: z.string() }))
        .optional(),
      restricting_filters: z
        .array(z.object({ key: z.string(), value: z.string(), label: z.string() }))
        .optional(),
    })
    .nullable()
    .optional(),
});
export type ListingResponse = z.infer<typeof listingResponseSchema>;
