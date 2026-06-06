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
  type OrderListItem,
  type OrderDetail,
  type GuestTrack,
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
    mutationFn: () => api.post(`/me/orders/${encodeURIComponent(orderNo)}/cancel`, {}, { schema: cancelResultSchema }),
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.detail(orderNo) }),
  });
}

export function useGuestTrack() {
  return useMutation({
    mutationFn: (body: { order_no: string; phone: string }): Promise<GuestTrack> =>
      api.post("/orders/track", body, { schema: guestTrackSchema, public: true }) as Promise<GuestTrack>,
  });
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
export function isRateLimited(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429;
}
