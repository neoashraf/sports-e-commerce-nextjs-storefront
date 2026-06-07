"use client";

import { useMutation } from "@tanstack/react-query";
import { auth } from "@/lib/api";
import { toast } from "@/lib/stores/toast";
import { useAuthStore } from "@/lib/stores/auth";
import { useAuthUi } from "@/lib/stores/auth-ui";

/**
 * Account-health banners (account-home §5 / email-register §6). Shown until
 * resolved: verify-email when `email_verified=false`; activate when
 * `is_lightweight=true`.
 */

export function VerifyEmailBanner({ email }: { email?: string | null }) {
  const resend = useMutation({
    mutationFn: () => auth.resendVerifyEmail(),
    onSuccess: () => toast("Verification email sent."),
    onError: () => toast("Couldn't resend right now. Please try again.", "error"),
  });

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <p className="text-sm text-amber-900">
        Verify your email to secure your account
        {email ? <span className="break-all"> — we sent a link to {email}.</span> : "."}
      </p>
      <button
        type="button"
        onClick={() => resend.mutate()}
        disabled={resend.isPending}
        className="text-sm font-semibold text-amber-900 underline hover:no-underline disabled:opacity-60"
      >
        {resend.isPending ? "Sending…" : "Resend"}
      </button>
    </div>
  );
}

export function ActivateBanner() {
  const openAuth = useAuthUi((s) => s.openAuth);
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3"
    >
      <p className="text-sm text-brand-700">
        You checked out as a guest — secure your account to track orders.
      </p>
      <button
        type="button"
        onClick={() => openAuth({ view: "claim" })}
        className="text-sm font-semibold text-brand-700 underline hover:no-underline"
      >
        Activate
      </button>
    </div>
  );
}

/** Convenience: render whichever prompts apply to the current customer. */
export function AccountStatusBanners() {
  const customer = useAuthStore((s) => s.customer);
  if (!customer) return null;
  return (
    <div className="space-y-2">
      {customer.is_lightweight && <ActivateBanner />}
      {customer.email && customer.email_verified === false && (
        <VerifyEmailBanner email={customer.email} />
      )}
    </div>
  );
}
