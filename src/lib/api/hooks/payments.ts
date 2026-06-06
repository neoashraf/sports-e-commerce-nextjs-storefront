"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { paymentSchema, retryResultSchema, type Payment } from "@/lib/api/schemas/payments";

/**
 * Storefront payment hooks (pay-result-fe). The result page polls the
 * AUTHORITATIVE payment status (finalized server-side by execute/IPN) — never
 * trusts the URL `status`. Polling stops once the status is terminal.
 *
 * The gateway return gives only `order` (order_no); the status is read by order
 * via `GET /payments?order=<orderNo>` (exact path is a BE-integration detail,
 * flagged in the PR — the contract documents GET /payments/{paymentId}).
 */
const TERMINAL = new Set(["paid", "failed", "cancelled", "cod_pending"]);

export const paymentKeys = { byOrder: (orderNo: string) => ["payment", "order", orderNo] as const };

export function usePaymentStatus(orderNo: string) {
  return useQuery({
    queryKey: paymentKeys.byOrder(orderNo),
    enabled: !!orderNo,
    queryFn: ({ signal }): Promise<Payment> =>
      api.get("/payments", { schema: paymentSchema, params: { order: orderNo }, signal }) as Promise<Payment>,
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
