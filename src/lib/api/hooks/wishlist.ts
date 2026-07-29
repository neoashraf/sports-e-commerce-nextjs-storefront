"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  wishlistListSchema,
  addWishlistResultSchema,
  moveToCartResultSchema,
  mergeWishlistResultSchema,
  type WishlistItem,
} from "@/lib/api/schemas/wishlist";
import { useAuthStore } from "@/lib/stores/auth";
import { useWishlistStore, getGuestWishlist } from "@/lib/stores/wishlist";

/**
 * Wishlist hooks (wishlist-fe). Customers hit the server; guests use the local
 * store (the page hydrates from it, hearts read it). All network via the api
 * client.
 */
export const wishlistKeys = {
  list: ["wishlist"] as const,
};

export function useWishlist() {
  const tokens = useAuthStore((s) => s.tokens);
  const setServerCount = useWishlistStore((s) => s.setServerCount);
  return useQuery({
    queryKey: wishlistKeys.list,
    enabled: !!tokens,
    queryFn: async (): Promise<WishlistItem[]> => {
      const items = (await api.get("/me/wishlist", {
        schema: wishlistListSchema,
      })) as WishlistItem[];
      setServerCount(items.length);
      return items;
    },
    staleTime: 30_000,
  });
}

export function useAddToWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { product_id: string; preferred_variant_id?: string }) =>
      api.post("/me/wishlist", body, { schema: addWishlistResultSchema }),
    onSuccess: () => qc.invalidateQueries({ queryKey: wishlistKeys.list }),
  });
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => api.delete<void>(`/me/wishlist/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: wishlistKeys.list }),
  });
}

export function useClearWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<void>("/me/wishlist"),
    onSuccess: () => qc.invalidateQueries({ queryKey: wishlistKeys.list }),
  });
}

export function useMoveToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { itemId: string; variant_id?: string; quantity?: number }) =>
      api.post(
        `/me/wishlist/${args.itemId}/move-to-cart`,
        { variant_id: args.variant_id, quantity: args.quantity ?? 1, keep_in_wishlist: true },
        { schema: moveToCartResultSchema },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: wishlistKeys.list });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

/**
 * Merge the guest local wishlist into the account (FR-WISH-031). Returns false when the guest
 * list is empty. Run on every login by `GuestSessionSync` — nothing else folds it across.
 */
export async function mergeGuestWishlist(): Promise<boolean> {
  const items = getGuestWishlist();
  // The API requires at least one entry (@ArrayMinSize(1)).
  if (items.length === 0) return false;
  await api.post(
    "/me/wishlist/merge",
    {
      // Send ONLY the contract fields: the API runs `forbidNonWhitelisted`, so the local display
      // `snapshot` we keep for the guest wishlist page would make the whole merge 400.
      items: items.map((i) => ({
        product_id: i.product_id,
        ...(i.preferred_variant_id ? { preferred_variant_id: i.preferred_variant_id } : {}),
      })),
    },
    { schema: mergeWishlistResultSchema },
  );
  useWishlistStore.getState().clearGuest();
  return true;
}

/** Merge the guest local wishlist into the account on login. */
export function useMergeWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => mergeGuestWishlist(),
    onSuccess: () => qc.invalidateQueries({ queryKey: wishlistKeys.list }),
  });
}

/** Badge count: guest local length, or the server total when authenticated. */
export function useWishlistCount(): number {
  const tokens = useAuthStore((s) => s.tokens);
  const guestLen = useWishlistStore((s) => s.guestItems.length);
  const serverCount = useWishlistStore((s) => s.serverCount);
  return tokens ? serverCount : guestLen;
}
