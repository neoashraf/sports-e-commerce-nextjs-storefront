"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  quoteResponseSchema,
  placeResponseSchema,
  type CheckoutAddress,
  type PaymentMethod,
  type PlaceResponse,
} from "@/lib/api/schemas/checkout";
import { getCartToken, useCartStore } from "@/lib/stores/cart";
import { cartKeys } from "@/lib/api/hooks/cart";

/**
 * Checkout hooks (checkout-fe). `quote` resolves zone/delivery/COD + summary on
 * each address/method change; `place` sends a persisted Idempotency-Key +
 * expected_total. The server summary is always authoritative.
 */
function cartHeaders(extra?: Record<string, string>): Record<string, string> | undefined {
  const token = getCartToken();
  const h: Record<string, string> = { ...extra };
  if (token) h["X-Cart-Token"] = token;
  return Object.keys(h).length ? h : undefined;
}

export function useQuote() {
  return useMutation({
    mutationFn: (body: { address: CheckoutAddress; payment_method: PaymentMethod }) =>
      api.post("/checkout/quote", body, { schema: quoteResponseSchema, headers: cartHeaders() }),
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      address: CheckoutAddress;
      payment_method: PaymentMethod;
      guest?: { full_name: string; phone: string; email?: string } | null;
      expected_total?: string | number | null;
      acknowledge_changes?: boolean;
      idempotencyKey: string;
    }): Promise<PlaceResponse> =>
      api.post(
        "/checkout/place",
        {
          address: args.address,
          payment_method: args.payment_method,
          guest: args.guest ?? null,
          // The backend validates expected_total with @IsNumberString — it must be a
          // non-empty decimal STRING (a JS number or "" both fail). Normalize defensively
          // so a numeric/blank value from the quote can never trip validation; omit it
          // entirely when we don't have a usable total (it's optional server-side).
          ...(args.expected_total !== undefined &&
          args.expected_total !== null &&
          String(args.expected_total).trim() !== ""
            ? { expected_total: String(args.expected_total) }
            : {}),
          acknowledge_changes: args.acknowledge_changes ?? false,
        },
        {
          schema: placeResponseSchema,
          headers: cartHeaders({ "Idempotency-Key": args.idempotencyKey }),
        },
      ) as Promise<PlaceResponse>,
    onSuccess: () => {
      // The order consumed the cart server-side; drop the local snapshot so the
      // shell badge resets to 0 and the next /cart read reflects the empty cart.
      useCartStore.getState().clear();
      void qc.invalidateQueries({ queryKey: cartKeys.cart });
    },
  });
}

/**
 * A persisted per-attempt idempotency key (FR-CART-036): a retry/refresh reuses
 * the same key until the order is placed. Generated without Math.random/Date
 * (those are fine in the browser, but we keep it simple + crypto-based).
 */
const KEY_STORAGE = "checkout-idempotency-key";

export function getOrCreateIdempotencyKey(): string {
  if (typeof window === "undefined") return "ssr";
  const existing = window.localStorage.getItem(KEY_STORAGE);
  if (existing) return existing;
  const key =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `ck_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
  window.localStorage.setItem(KEY_STORAGE, key);
  return key;
}

export function clearIdempotencyKey() {
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY_STORAGE);
}
