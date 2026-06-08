"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { useAuthStore } from "@/lib/stores/auth";
import {
  orderListSchema,
  orderDetailSchema,
  cancelResultSchema,
  guestTrackSchema,
  requestExchangeResultSchema,
  exchangeStatusSchema,
  replacementResultSchema,
  type OrderListItem,
  type OrderDetail,
  type GuestTrack,
  type ExchangeStatus,
  type ExchangeReason,
} from "@/lib/api/schemas/orders";

/**
 * Order hooks (ord-storefront-fe). Customer history/detail/cancel/invoice +
 * public guest tracking. All via the api client.
 */
export const orderKeys = {
  list: (page: number) => ["orders", "list", page] as const,
  detail: (orderNo: string) => ["orders", "detail", orderNo] as const,
};

export function useOrderHistory(page = 1) {
  const tokens = useAuthStore((s) => s.tokens);
  return useQuery({
    queryKey: orderKeys.list(page),
    enabled: !!tokens,
    queryFn: (): Promise<OrderListItem[]> =>
      api.get("/me/orders", { schema: orderListSchema, params: { page, limit: 20 } }) as Promise<OrderListItem[]>,
    staleTime: 30_000,
  });
}

export function useOrderDetail(orderNo: string) {
  const tokens = useAuthStore((s) => s.tokens);
  return useQuery({
    queryKey: orderKeys.detail(orderNo),
    enabled: !!tokens && !!orderNo,
    queryFn: (): Promise<OrderDetail> =>
      api.get(`/me/orders/${encodeURIComponent(orderNo)}`, { schema: orderDetailSchema }) as Promise<OrderDetail>,
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
    staleTime: 15_000,
  });
}

export function useCancelOrder(orderNo: string) {
  const qc = useQueryClient();
  return useMutation({
    // The API requires a non-empty cancellation reason (contract 06 §Cancel own order).
    mutationFn: (reason: string) =>
      api.post(`/me/orders/${encodeURIComponent(orderNo)}/cancel`, { reason }, { schema: cancelResultSchema }),
    // Invalidate the whole orders namespace (prefix match) so BOTH the detail view and
    // every cached list page refetch — otherwise the list keeps showing the stale
    // "confirmed" status after a cancel while the detail page shows "cancelled".
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useGuestTrack() {
  return useMutation({
    mutationFn: (body: { order_no: string; phone: string }): Promise<GuestTrack> =>
      api.post("/orders/track", body, { schema: guestTrackSchema, public: true }) as Promise<GuestTrack>,
  });
}

// ---- Exchanges (ord-exchange-fe) ----

export function useRequestExchange(orderNo: string) {
  return useMutation({
    mutationFn: (body: {
      order_item_id: string;
      reason: ExchangeReason;
      customer_note?: string;
      attachment_ids?: string[];
    }) =>
      api.post(`/me/orders/${encodeURIComponent(orderNo)}/exchanges`, body, {
        schema: requestExchangeResultSchema,
      }),
  });
}

export function useExchangeStatus(orderNo: string, exchangeId: string) {
  return useQuery({
    queryKey: ["exchange", orderNo, exchangeId] as const,
    enabled: !!orderNo && !!exchangeId,
    queryFn: (): Promise<ExchangeStatus> =>
      api.get(`/me/orders/${encodeURIComponent(orderNo)}/exchanges/${encodeURIComponent(exchangeId)}`, {
        schema: exchangeStatusSchema,
      }) as Promise<ExchangeStatus>,
    staleTime: 15_000,
  });
}

export function useConfirmReplacement(orderNo: string, exchangeId: string) {
  return useMutation({
    mutationFn: (replacementVariantId: string) =>
      api.post(
        `/me/orders/${encodeURIComponent(orderNo)}/exchanges/${encodeURIComponent(exchangeId)}/replacement`,
        { replacement_variant_id: replacementVariantId },
        { schema: replacementResultSchema },
      ),
  });
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
export function isRateLimited(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429;
}
