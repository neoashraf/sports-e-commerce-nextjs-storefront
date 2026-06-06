"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addresses as addressApi } from "@/lib/api";
import type { AddressDto } from "@/lib/api/schemas/auth";
import { useAuthStore } from "@/lib/stores/auth";

/**
 * Address-book data layer (address-book brief). Reads cached under ['addresses'];
 * every mutation invalidates it so the server-resolved zone / promoted default
 * is reflected. Default change is optimistic (revert on error) per §9.
 */
export const addressKeys = { all: ["addresses"] as const };

export function useAddresses() {
  const tokens = useAuthStore((s) => s.tokens);
  return useQuery({
    queryKey: addressKeys.all,
    enabled: !!tokens,
    queryFn: () => addressApi.list(),
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<AddressDto, "id" | "delivery_zone">) => addressApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Omit<AddressDto, "id">> }) =>
      addressApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

/** Optimistic "set as default" — snapshot, flip locally, revert on error. */
export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => addressApi.update(id, { is_default: true }),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: addressKeys.all });
      const prev = qc.getQueryData<AddressDto[]>(addressKeys.all);
      if (prev) {
        qc.setQueryData<AddressDto[]>(
          addressKeys.all,
          prev.map((a) => ({ ...a, is_default: a.id === id })),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(addressKeys.all, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}
