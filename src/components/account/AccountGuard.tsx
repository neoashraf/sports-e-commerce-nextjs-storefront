"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useAuthUi } from "@/lib/stores/auth-ui";

/**
 * Gate for /account/* (account-home §11: guests are redirected to auth). Opens
 * the auth sheet and bounces to the storefront home when unauthenticated.
 * Gated on `hydrated` so we don't redirect before the persisted token loads.
 */
export function AccountGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const tokens = useAuthStore((s) => s.tokens);
  const openAuth = useAuthUi((s) => s.openAuth);

  useEffect(() => {
    if (hydrated && !tokens) {
      openAuth({ resume: () => router.replace("/account") });
      router.replace("/");
    }
  }, [hydrated, tokens, openAuth, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }
  if (!tokens) return null;
  return <>{children}</>;
}
