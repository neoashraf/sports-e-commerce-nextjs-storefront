import { z } from "zod";
import { cardFieldsShape } from "./search";

/**
 * Zod schemas for the storefront product-detail payload
 * (GET /api/v1/products/{slug} — docs/api-contracts/02-catalog.md).
 *
 * Money fields are decimal STRINGS on the wire ("12500.00") — kept as strings
 * here and parsed at render via `lib/format.ts` to avoid float drift.
 */

export const stockStatusSchema = z.enum(["in_stock", "low_stock", "out_of_stock"]);
export type StockStatus = z.infer<typeof stockStatusSchema>;

export const productImageSchema = z.object({
  id: z.string(),
  renditions: z.object({
    detail: z.string().optional(),
    thumb: z.string().optional(),
  }),
  /** Original fallback when a rendition isn't ready (§13.4). */
  url: z.string().optional(),
  alt_text: z.string().nullable().optional(),
  color_option_id: z.string().nullable().optional(),
  is_primary: z.boolean().optional(),
});
export type ProductImage = z.infer<typeof productImageSchema>;

export const productVideoSchema = z.object({
  id: z.string(),
  source: z.string(),
  url: z.string(),
});

export const attributeOptionSchema = z.object({
  id: z.string(),
  value: z.string(),
  // Backend serializes these as explicit `null` for non-swatch options (e.g. size),
  // so accept null as well as absent.
  swatch_type: z.enum(["color", "image"]).nullable().optional(),
  swatch_value: z.string().nullable().optional(),
});
export type AttributeOption = z.infer<typeof attributeOptionSchema>;

export const configurableAttributeSchema = z.object({
  code: z.string(),
  label: z.string(),
  options: z.array(attributeOptionSchema),
});
export type ConfigurableAttribute = z.infer<typeof configurableAttributeSchema>;

export const variantSchema = z.object({
  id: z.string(),
  sku_code: z.string(),
  /** Map of attribute code → selected option id (e.g. { color: "o-black", size: "o-42" }). */
  options: z.record(z.string()),
  price: z.string(),
  stock_status: stockStatusSchema,
});
export type Variant = z.infer<typeof variantSchema>;

export const specSchema = z.object({
  code: z.string(),
  label: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
});
export type Spec = z.infer<typeof specSchema>;

/** PDP size-guide chart resolved onto the product detail (RW6); null → trigger hidden. */
export const sizeGuideRowSchema = z.object({
  uk: z.string(),
  foot: z.string(),
});
export const sizeGuideSchema = z.object({
  measure_note: z.string(),
  unit: z.string().default("cm"),
  rows: z.array(sizeGuideRowSchema).default([]),
});
export type SizeGuide = z.infer<typeof sizeGuideSchema>;

export const productCardLinkSchema = z.object({
  id: z.string(),
  slug: z.string(),
  // Note: link cards use `name` (not `title`); the card adapter maps it.
  name: z.string(),
  primary_image: z.string().nullable().optional(),
  effective_price: z.string(),
  base_price: z.string().optional(),
  on_sale: z.boolean().optional(),
  // RW6 card fields — related/cross-sell rails render the v2 ProductCard.
  ...cardFieldsShape,
});
export type ProductCardLink = z.infer<typeof productCardLinkSchema>;

export const productDetailSchema = z.object({
  id: z.string(),
  type: z.enum(["simple", "configurable"]),
  family: z.string().optional(),
  name: z.string(),
  name_bn: z.string().nullable().optional(),
  slug: z.string(),
  brand: z.string().nullable().optional(),
  breadcrumb: z.array(z.string()).default([]),
  short_description: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  effective_price: z.string(),
  base_price: z.string(),
  currency: z.string().default("BDT"),
  sale_active: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  images: z.array(productImageSchema).default([]),
  videos: z.array(productVideoSchema).default([]),
  configurable_attributes: z.array(configurableAttributeSchema).default([]),
  variants: z.array(variantSchema).default([]),
  specs: z.array(specSchema).default([]),
  // RW6 — resolved category size guide; nullable/optional → a pre-RW6 payload still parses.
  size_guide: sizeGuideSchema.nullable().optional(),
  links: z
    .object({
      related: z.array(productCardLinkSchema).default([]),
      up_sell: z.array(productCardLinkSchema).default([]),
      cross_sell: z.array(productCardLinkSchema).default([]),
    })
    .default({ related: [], up_sell: [], cross_sell: [] }),
});
export type ProductDetail = z.infer<typeof productDetailSchema>;
