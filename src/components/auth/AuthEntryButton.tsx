"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";

/**
 * Header entry to auth (phone-otp-login §1 entry points). Shows "Log in /
 * Sign up" for guests (opens the auth sheet) and "My Account" once signed in.
 * Gated on hydration to avoid an SSR mismatch reading the persisted token.
 */
export function AuthEntryButton() {
  const { isAuthenticated, hydrated, requireAuth } = useAuth();

  if (!hydrated) {
    return <span className="inline-block h-9 w-28 animate-pulse rounded-md bg-surface-100" />;
  }

  if (isAuthenticated) {
    return (
      <Link
        href="/account"
        className="inline-flex min-h-[40px] items-center rounded-md border border-border-strong px-3 text-body-sm font-medium text-ink transition-colors duration-micro ease-out hover:bg-surface-100"
      >
        My Account
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => requireAuth()}
      className="inline-flex min-h-[40px] items-center rounded-md bg-volt px-4 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
    >
      Log in / Sign up
    </button>
  );
}
