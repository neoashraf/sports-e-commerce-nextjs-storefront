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

/** A saved-address reference or a full guest/new address. */
export type CheckoutAddress =
  | { address_id: string }
  | {
      full_name: string;
      phone: string;
      email?: string;
      division: string;
      district: string;
      upazila: string;
      street: string;
      postal_code?: string;
      landmark?: string;
    };
