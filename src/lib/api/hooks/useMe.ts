"use client";

import { useQuery } from "@tanstack/react-query";
import { me as meApi } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth";
import { patchCustomer } from "@/lib/auth/session";

/**
 * GET /me — current customer profile. Syncs verification/password flags back
 * into the auth store so banners stay accurate after a reload.
 */
export const meKeys = { me: ["me"] as const };

export function useMe() {
  const tokens = useAuthStore((s) => s.tokens);
  return useQuery({
    queryKey: meKeys.me,
    enabled: !!tokens,
    queryFn: async () => {
      const data = await meApi.get();
      patchCustomer({
        full_name: data.full_name ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        email_verified: data.email_verified,
        phone_verified: data.phone_verified,
        has_password: data.has_password,
      });
      return data;
    },
    staleTime: 60_000,
  });
}
