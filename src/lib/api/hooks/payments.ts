"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  paymentSchema,
  retryResultSchema,
  type Payment,
} from "@/lib/api/schemas/payments";

/**
 * Storefront payment hooks (pay-result-fe). The result page polls the
 * AUTHORITATIVE payment status (finalized server-side by execute/IPN) — never
 * trusts the URL `status`. Polling stops once the status is terminal.
 *
 * Status is read by the merchant `ref` (the unguessable `PAY-…` capability token
 * carried in the gateway return URL) via `GET /payments?ref=<ref>` — works for
 * guests with no JWT (contract 05-payments §"Payment status by merchant ref").
 */
const TERMINAL = new Set(["paid", "failed", "cancelled", "cod_pending"]);

// Stop polling after this many refetches as a safety cap (~3 min at 2s each).
// TODO(payments): confirm the intended cap with the PAY lane owner.
const MAX_POLLS = 90;

export const paymentKeys = {
  byOrder: (orderNo: string) => ["payment", "order", orderNo] as const,
  byRef: (ref: string) => ["payment", "ref", ref] as const,
};

export function usePaymentStatus(ref: string) {
  return useQuery({
    queryKey: paymentKeys.byRef(ref),
    enabled: !!ref,
    queryFn: ({ signal }): Promise<Payment> =>
      api.get("/payments", {
        schema: paymentSchema,
        params: { ref },
        signal,
      }) as Promise<Payment>,
    // Poll every 2s until the status is terminal.
    refetchInterval: (query) => {
      const status = (query.state.data as Payment | undefined)?.status;
      if (status && TERMINAL.has(status)) return false;
      if (query.state.dataUpdateCount >= MAX_POLLS) return false;
      return 2000;
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
