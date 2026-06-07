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
    return <span className="inline-block h-9 w-28 animate-pulse rounded-lg bg-gray-100" />;
  }

  if (isAuthenticated) {
    return (
      <Link
        href="/account"
        className="inline-flex min-h-[40px] items-center rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
      >
        My Account
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => requireAuth()}
      className="inline-flex min-h-[40px] items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
    >
      Log in / Sign up
    </button>
  );
}
