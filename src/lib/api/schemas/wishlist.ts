import { z } from "zod";

/**
 * Zod schemas for the wishlist payloads (GET/POST/DELETE /me/wishlist* —
 * docs/api-contracts/07-wishlist.md).
 */

export const wishlistAvailabilitySchema = z.enum([
  "in_stock",
  "low_stock",
  "out_of_stock",
  "unavailable",
]);
export type WishlistAvailability = z.infer<typeof wishlistAvailabilitySchema>;

export const wishlistItemSchema = z.object({
  item_id: z.string(),
  product: z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    brand: z.string().nullable().optional(),
    primary_image: z.string().nullable().optional(),
    effective_price: z.string(),
    base_price: z.string().optional(),
    on_sale: z.boolean().default(false),
    currency: z.string().default("BDT"),
  }),
  preferred_variant: z
    .object({
      id: z.string(),
      sku_code: z.string().optional(),
      options: z.record(z.string()).default({}),
    })
    .nullable()
    .optional(),
  availability: wishlistAvailabilitySchema.default("in_stock"),
  is_available: z.boolean().default(true),
  added_at: z.string().optional(),
});
export type WishlistItem = z.infer<typeof wishlistItemSchema>;

export const wishlistListSchema = z.array(wishlistItemSchema);

export const wishlistMetaSchema = z.object({
  total: z.number().default(0),
  max_items: z.number().default(100),
});

export const addWishlistResultSchema = z.object({
  item_id: z.string(),
  already_present: z.boolean().default(false),
});

export const membershipSchema = z.record(z.boolean());

export const moveToCartResultSchema = z.object({
  cart_item_id: z.string(),
  moved: z.boolean().default(true),
  kept_in_wishlist: z.boolean().default(true),
});

export const mergeWishlistResultSchema = z.object({
  merged_count: z.number().default(0),
  skipped_duplicates: z.number().default(0),
  dropped_unpublished: z.number().default(0),
  skipped_over_cap: z.number().default(0),
  total: z.number().default(0),
});
