"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  cartSchema,
  addItemResultSchema,
  updateItemResultSchema,
  applyCouponResultSchema,
  mergeCartResultSchema,
  type Cart,
  type UpdateItemResult,
} from "@/lib/api/schemas/cart";
import { useCartStore, getCartToken, setCartToken } from "@/lib/stores/cart";

/**
 * Cart hooks (cart-core-fe). Every request carries the guest `X-Cart-Token`
 * (when present) so a guest cart persists. The displayed subtotal always comes
 * from the server snapshot kept in the cart store.
 *
 * A guest write with no token makes the server mint a fresh cart + token, which
 * it returns via the `X-Cart-Token` response header. `captureCartToken` reads
 * that header (exposed by the client's `onResponse` hook) and persists it so the
 * cart is found again on the next request — without it, every cart looks empty.
 */
export const cartKeys = { cart: ["cart"] as const };

function cartHeaders(): Record<string, string> | undefined {
  const token = getCartToken();
  return token ? { "X-Cart-Token": token } : undefined;
}

/** Persist the (possibly freshly-minted) guest cart token from the response. */
function captureCartToken(res: Response): void {
  const token = res.headers.get("X-Cart-Token");
  if (token && token !== getCartToken()) setCartToken(token);
}

export function useCart() {
  const setCart = useCartStore((s) => s.setCart);
  return useQuery({
    queryKey: cartKeys.cart,
    queryFn: async (): Promise<Cart> => {
      const cart = (await api.get("/cart", {
        schema: cartSchema,
        headers: cartHeaders(),
        onResponse: captureCartToken,
      })) as Cart;
      setCart(cart);
      return cart;
    },
    staleTime: 10_000,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  const openDrawer = useCartStore((s) => s.openDrawer);
  return useMutation({
    mutationFn: (body: { variant_id: string; quantity: number }) =>
      api.post("/cart/items", body, {
        schema: addItemResultSchema,
        headers: cartHeaders(),
        onResponse: captureCartToken,
      }),
    onSuccess: async (res) => {
      // The token must land in the store before the cart refetch fires, or the
      // refetch goes out token-less and the server returns an empty cart.
      await qc.invalidateQueries({ queryKey: cartKeys.cart });
      openDrawer(res.item_id);
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    // PATCH returns the updated LINE + summary (contract 04 §PATCH) — NOT the whole
    // cart. Validating against cartSchema here used to fail the parse, so onSuccess
    // never ran and the qty in the UI never moved. Parse the real shape, then merge
    // the line into the cached cart and swap in the recomputed summary.
    mutationFn: (args: { itemId: string; quantity: number }): Promise<UpdateItemResult> =>
      api.patch(`/cart/items/${args.itemId}`, { quantity: args.quantity }, {
        schema: updateItemResultSchema,
        headers: cartHeaders(),
        onResponse: captureCartToken,
      }) as Promise<UpdateItemResult>,
    onSuccess: (res) => {
      const prev = qc.getQueryData<Cart>(cartKeys.cart);
      if (!prev) {
        // No cached cart to patch — fall back to a fresh read.
        void qc.invalidateQueries({ queryKey: cartKeys.cart });
        return;
      }
      const next: Cart = {
        ...prev,
        items: prev.items.map((it) => (it.item_id === res.line.item_id ? res.line : it)),
        summary: res.summary,
      };
      useCartStore.getState().setCart(next);
      qc.setQueryData(cartKeys.cart, next);
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      api.delete<void>(`/cart/items/${itemId}`, undefined, { headers: cartHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.cart }),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<void>("/cart", undefined, { headers: cartHeaders() }),
    onSuccess: () => {
      useCartStore.getState().clear();
      qc.invalidateQueries({ queryKey: cartKeys.cart });
    },
  });
}

export function useApplyCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      api.post("/cart/coupon", { code }, { schema: applyCouponResultSchema, headers: cartHeaders(), onResponse: captureCartToken }),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.cart }),
  });
}

export function useRemoveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<void>("/cart/coupon", undefined, { headers: cartHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.cart }),
  });
}

/**
 * Fold the guest cart into the signed-in customer's cart (FR-CART-007). Returns false when
 * there was nothing to merge.
 *
 * This MUST run on every login/registration: the backend resolves an authenticated shopper's
 * cart by `customer_id` alone and never falls back to the `X-Cart-Token`, so everything added
 * as a guest is invisible the moment the shopper signs in until this call folds it across.
 * Mounted globally by `GuestSessionSync`; checkout also calls it before placing.
 */
export async function mergeGuestCart(): Promise<boolean> {
  const token = getCartToken();
  // No guest cart to fold in — and the API rejects an empty cart_token (@IsNotEmpty).
  if (!token) return false;
  await api.post("/cart/merge", { cart_token: token }, { schema: mergeCartResultSchema });
  // The guest cart is CONVERTED server-side now; drop the stale token so later requests resolve
  // by customer id, and a future guest session mints a fresh one.
  setCartToken(null);
  return true;
}

export function useMergeCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => mergeGuestCart(),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.cart }),
  });
}
