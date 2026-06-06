import { z } from "zod";

/**
 * Zod schemas for storefront payment status (GET /payments/{id} /
 * POST /payments/retry — docs/api-contracts/05-payments.md).
 */

export const paymentStatusSchema = z.enum([
  "initiated",
  "pending",
  "paid",
  "failed",
  "cancelled",
  "cod_pending",
]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const paymentSchema = z.object({
  payment_id: z.string(),
  order_id: z.string().optional(),
  order_no: z.string().optional(),
  method: z.string().optional(),
  status: paymentStatusSchema,
  amount: z.string().optional(),
  currency: z.string().optional(),
  gateway_txn_id: z.string().optional(),
  paid_at: z.string().optional(),
});
export type Payment = z.infer<typeof paymentSchema>;

export const retryResultSchema = z.object({
  payment_id: z.string(),
  status: z.string(),
  action: z.enum(["redirect", "none"]).optional(),
  redirect_url: z.string().optional(),
});
