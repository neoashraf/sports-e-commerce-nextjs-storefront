"use client";

import { useAuthStore } from "@/lib/stores/auth";
import { useAuthUi, type AuthView } from "@/lib/stores/auth-ui";

/**
 * Convenience hook for components that need to read auth state or trigger the
 * auth sheet (with an optional "resume this action after login" callback).
 */
export function useAuth() {
  const customer = useAuthStore((s) => s.customer);
  const tokens = useAuthStore((s) => s.tokens);
  const hydrated = useAuthStore((s) => s.hydrated);
  const openAuth = useAuthUi((s) => s.openAuth);

  return {
    customer,
    isAuthenticated: !!tokens,
    hydrated,
    /** Open the auth sheet; pass a `resume` to run the gated action on success. */
    requireAuth: (resume?: () => void, view?: AuthView) =>
      openAuth({ resume, view }),
    openAuth,
  };
}
