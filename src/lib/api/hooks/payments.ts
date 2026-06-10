"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { paymentSchema, retryResultSchema, type Payment } from "@/lib/api/schemas/payments";

/**
 * Storefront payment hooks (pay-result-fe). The result page polls the
 * AUTHORITATIVE payment status (finalized server-side by execute/IPN) — never
 * trusts the URL `status`. Polling stops once the status is terminal.
 *
 * The gateway return carries `ref` (the merchant `PAY-…` token, an unguessable
 * capability), so the status is read by ref via the public `GET /payments?ref=…`
 * — this works for guest checkouts (no JWT). The returned `order_no` powers the
 * success / confirmation deep-links.
 */
const TERMINAL = new Set(["paid", "failed", "cancelled", "cod_pending"]);

export const paymentKeys = { byRef: (ref: string) => ["payment", "ref", ref] as const };

export function usePaymentStatus(ref: string) {
  return useQuery({
    queryKey: paymentKeys.byRef(ref),
    enabled: !!ref,
    queryFn: ({ signal }): Promise<Payment> =>
      api.get("/payments", { schema: paymentSchema, params: { ref }, signal }) as Promise<Payment>,
    // Poll every 2s until the status is terminal.
    refetchInterval: (query) => {
      const status = (query.state.data as Payment | undefined)?.status;
      return status && TERMINAL.has(status) ? false : 2000;
    },
    retry: 2,
  });
}

export function useRetryPayment() {
  return useMutation({
    mutationFn: (args: { order_id: string; method: string }) =>
      api.post("/payments/retry", args, { schema: retryResultSchema }),
  });
}
