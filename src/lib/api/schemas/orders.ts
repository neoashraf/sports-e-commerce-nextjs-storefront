import { z } from "zod";

/**
 * Zod schemas for the customer + guest order payloads
 * (/me/orders*, /orders/track — docs/api-contracts/06-orders-tracking.md).
 */

export const orderStatusSchema = z.enum([
  "pending_payment",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderHistoryEntrySchema = z.object({
  from_status: z.string().nullable().optional(),
  to_status: z.string(),
  actor_type: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  created_at: z.string(),
});

export const orderListItemSchema = z.object({
  order_no: z.string(),
  placed_at: z.string(),
  status: z.string(),
  grand_total: z.string().optional(),
  item_count: z.number().optional(),
});
export type OrderListItem = z.infer<typeof orderListItemSchema>;

export const orderListSchema = z.array(orderListItemSchema);

export const orderItemSchema = z.object({
  product_title: z.string(),
  // RW6 — per-item presentation fields (resolved from the product; null when unavailable).
  product_title_bn: z.string().nullable().optional(),
  product_image: z.string().nullable().optional(),
  sku_code: z.string().nullable().optional(),
  variant_options: z.record(z.string()).default({}),
  unit_price: z.string(),
  quantity: z.number(),
  line_total: z.string(),
});

export const orderDetailSchema = z.object({
  order_no: z.string(),
  status: z.string(),
  payment_method: z.string().optional(),
  payment_state: z.string().optional(),
  delivery_zone: z.string().nullable().optional(),
  placed_at: z.string().optional(),
  address: z
    .object({
      recipient_name: z.string(),
      recipient_phone: z.string(),
      address_line: z.string(),
      area: z.string().nullable().optional(),
      district: z.string().nullable().optional(),
      division: z.string().nullable().optional(),
      postal_code: z.string().nullable().optional(),
    })
    .optional(),
  items: z.array(orderItemSchema).default([]),
  amounts: z
    .object({
      subtotal: z.string(),
      discount: z.string().optional(),
      delivery_charge: z.string().optional(),
      cod_surcharge: z.string().optional(),
      vat: z.string().optional(),
      grand_total: z.string(),
    })
    .optional(),
  applied_coupon_code: z.string().nullable().optional(),
  shipment: z
    .object({ courier_name: z.string().nullable().optional(), tracking_number: z.string().nullable().optional() })
    .nullable()
    .optional(),
  /** Whether the order is within the post-delivery exchange window (drives the entry). */
  exchange_eligible: z.boolean().optional(),
  history: z.array(orderHistoryEntrySchema).default([]),
});
export type OrderDetail = z.infer<typeof orderDetailSchema>;

export const cancelResultSchema = z.object({
  order_no: z.string(),
  status: z.string(),
  refund_note: z.string().optional(),
});

// ---- Exchanges (ord-exchange-fe) ----

export const exchangeReasonSchema = z.enum([
  "wrong_size",
  "wrong_item",
  "changed_mind",
  "quality_defect",
]);
export type ExchangeReason = z.infer<typeof exchangeReasonSchema>;

export const requestExchangeResultSchema = z.object({
  exchange_id: z.string(),
  status: z.string(),
  message: z.string().optional(),
});

export const exchangeStatusSchema = z.object({
  exchange_id: z.string(),
  status: z.string(),
  reason: z.string().optional(),
  replacement_options_hint: z.string().optional(),
  price_difference: z.string().optional(),
  replacement_order_no: z.string().nullable().optional(),
});
export type ExchangeStatus = z.infer<typeof exchangeStatusSchema>;

export const replacementResultSchema = z.object({
  status: z.string(),
  price_difference: z.string().optional(),
  replacement_order_no: z.string().nullable().optional(),
  payment: z
    .object({ action: z.enum(["redirect", "none"]), redirect_url: z.string().optional() })
    .optional(),
});

export const guestTrackSchema = z.object({
  order_no: z.string(),
  status: z.string(),
  placed_at: z.string().optional(),
  shipment: z
    .object({ courier_name: z.string().nullable().optional(), tracking_number: z.string().nullable().optional() })
    .nullable()
    .optional(),
  history: z.array(orderHistoryEntrySchema).default([]),
});
export type GuestTrack = z.infer<typeof guestTrackSchema>;
