import { z } from "zod";
import { cartSummarySchema } from "@/lib/api/schemas/cart";

/**
 * Zod schemas for the checkout quote/place responses
 * (POST /checkout/quote, /checkout/place — docs/api-contracts/04-cart-checkout.md).
 */

export const paymentMethodSchema = z.enum(["cod", "bkash", "sslcommerz"]);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const quoteResponseSchema = z.object({
  delivery_zone: z.string().nullable().optional(),
  summary: cartSummarySchema,
  cod_available: z.boolean().default(true),
  payment_methods: z.array(paymentMethodSchema).default(["cod"]),
});
export type QuoteResponse = z.infer<typeof quoteResponseSchema>;

export const placeResponseSchema = z.object({
  order: z.object({
    id: z.string(),
    order_no: z.string(),
    status: z.string(),
    grand_total: z.string(),
  }),
  payment: z.object({
    method: paymentMethodSchema,
    action: z.enum(["redirect", "none"]),
    redirect_url: z.string().optional(),
    status: z.string().optional(),
  }),
});
export type PlaceResponse = z.infer<typeof placeResponseSchema>;

/**
 * A saved-address reference or a full guest/new address. The full-address shape
 * mirrors the backend `CheckoutAddressDto` EXACTLY (recipient_name / address_line
 * / area / district / division / postal_code) — the API rejects any extra key
 * (full_name, phone, email, upazila, street, landmark) with `forbidNonWhitelisted`.
 * Recipient identity (full_name/phone/email) travels in the `guest` block, not here.
 */
export type CheckoutAddress =
  | { address_id: string }
  | {
      recipient_name: string;
      recipient_phone: string;
      address_line: string;
      /** Area / upazila — the backend resolves the delivery zone from this. */
      area: string;
      district: string;
      division: string;
      postal_code?: string;
    };
