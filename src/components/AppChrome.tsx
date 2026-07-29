"use client";

import { AuthSheet } from "@/components/auth/AuthSheet";
import { DevOtpBanner } from "@/components/DevOtpBanner";
import { GuestSessionSync } from "@/components/GuestSessionSync";
import { ToastViewport } from "@/components/ui/ToastViewport";
import { MiniCartDrawer } from "@/components/cart/MiniCartDrawer";
// Side-effect import: registers the 401 → token-refresh handler on the API client.
import "@/lib/auth/session";

/**
 * Global client chrome mounted once in the root layout: the auth overlay, the
 * toast viewport, and the guest → account cart/wishlist handover. Also pulls in
 * the session module so the API client's refresh interceptor is wired up before
 * any request runs.
 */
export function AppChrome() {
  return (
    <>
      {/* DEV-ONLY: shows the last echoed OTP at the top of the page (no-op in production). */}
      <DevOtpBanner />
      <AuthSheet />
      <MiniCartDrawer />
      {/* Folds a guest cart/wishlist into the account on login, from ANY login entry point. */}
      <GuestSessionSync />
      <ToastViewport />
    </>
  );
}
