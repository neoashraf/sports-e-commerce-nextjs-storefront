/**
 * Session glue: map API session/customer DTOs into the Zustand auth store,
 * refresh tokens on demand, and log out. Keeps the store free of API shapes.
 */

import { auth as authApi } from "@/lib/api";
import { setRefreshHandler } from "@/lib/api/client";
import { useAuthStore, type Customer } from "@/lib/stores/auth";
import type { CustomerDto, TokensDto } from "@/lib/api/schemas/auth";

function toCustomer(dto: CustomerDto): Customer {
  return {
    id: dto.id,
    full_name: dto.full_name ?? null,
    phone: dto.phone ?? null,
    email: dto.email ?? null,
    phone_verified: dto.phone_verified,
    email_verified: dto.email_verified,
    has_password: dto.has_password,
  };
}

/** Persist a fresh session (from login/verify/register). */
export function commitSession(customerDto: CustomerDto, tokens: TokensDto) {
  useAuthStore.getState().setSession(toCustomer(customerDto), {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  });
}

/** Merge updated customer fields into the stored session (e.g. after PATCH /me). */
export function patchCustomer(patch: Partial<Customer>) {
  const current = useAuthStore.getState().customer;
  if (current) useAuthStore.getState().setCustomer({ ...current, ...patch });
}

/**
 * Refresh the access token using the stored refresh token. Returns the new
 * access token, or null if there is no refresh token / the refresh failed
 * (in which case the session is cleared so the UI can re-auth).
 */
export async function refreshSession(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().tokens?.refreshToken;
  if (!refreshToken) {
    // Got a 401 but have no refresh token to recover with — the session is dead.
    // Clear it so the UI drops to the signed-out state instead of holding a token
    // that will keep 401-ing.
    useAuthStore.getState().clear();
    return null;
  }
  try {
    const res = await authApi.refresh(refreshToken);
    useAuthStore.getState().setTokens({
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
    });
    return res.access_token;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

// Wire the client's 401 → refresh hook to this module's refresh logic.
setRefreshHandler(refreshSession);

/** Best-effort server revoke, then always clear locally. */
export async function endSession(): Promise<void> {
  const refreshToken = useAuthStore.getState().tokens?.refreshToken;
  if (refreshToken) {
    try {
      await authApi.logout(refreshToken);
    } catch {
      /* ignore — clear locally regardless */
    }
  }
  useAuthStore.getState().clear();
}
