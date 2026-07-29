import { z } from "zod";

/**
 * Zod schemas for the cart payloads (GET/POST/PATCH /cart* —
 * docs/api-contracts/04-cart-checkout.md). Money fields are decimal strings.
 */

export const cartItemSchema = z.object({
  item_id: z.string(),
  product_id: z.string(),
  variant_id: z.string(),
  sku_code: z.string().optional(),
  title: z.string(),
  /** Optional Bangla product name shown under the title on the cart line (design kit). */
  title_bn: z.string().nullable().optional(),
  /** Configurable-attribute option values, e.g. { color: "Black", size: "42" }. */
  options: z.record(z.string()).default({}),
  image: z.string().nullable().optional(),
  unit_price: z.string(),
  quantity: z.number(),
  line_total: z.string(),
  availability: z.enum(["in_stock", "low_stock", "out_of_stock", "unavailable"]).default("in_stock"),
  /** Live remaining stock for a low-stock line → renders "Only N in stock." (optional). */
  stock_left: z.number().nullable().optional(),
});
export type CartItem = z.infer<typeof cartItemSchema>;

export const cartSummarySchema = z.object({
  subtotal: z.string(),
  discount: z.string().optional(),
  delivery_charge: z.string().nullable().optional(),
  cod_surcharge: z.string().nullable().optional(),
  vat: z.string().nullable().optional(),
  grand_total: z.string().nullable().optional(),
  delivery_zone: z.string().nullable().optional(),
});
export type CartSummary = z.infer<typeof cartSummarySchema>;

export const cartSchema = z.object({
  cart_id: z.string(),
  currency: z.string().default("BDT"),
  items: z.array(cartItemSchema).default([]),
  applied_coupon: z
    // `free_shipping` coupons carry no subtotal discount (`discount` stays "0.00") — the benefit is
    // the waived delivery charge in the checkout quote, so the UI must label them, not show "−৳0".
    .object({ code: z.string(), discount: z.string(), free_shipping: z.boolean().optional() })
    .nullable()
    .optional(),
  summary: cartSummarySchema,
});
export type Cart = z.infer<typeof cartSchema>;

export const addItemResultSchema = z.object({
  item_id: z.string(),
  quantity: z.number(),
  capped: z.boolean().default(false),
});

/** PATCH /cart/items/{id} returns the updated line + the recomputed summary (contract 04 §PATCH). */
export const updateItemResultSchema = z.object({
  line: cartItemSchema,
  capped: z.boolean().default(false),
  summary: cartSummarySchema,
});
export type UpdateItemResult = z.infer<typeof updateItemResultSchema>;

export const applyCouponResultSchema = z.object({
  applied: z.boolean().default(true),
  code: z.string(),
  discount: z.string(),
  summary: cartSummarySchema.optional(),
});

export const mergeCartResultSchema = z.object({
  merged_lines: z.number().default(0),
  capped_lines: z.number().default(0),
  summary: cartSummarySchema.optional(),
});
