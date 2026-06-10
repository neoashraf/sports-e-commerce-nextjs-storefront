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
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/40 bg-warning/15 px-4 py-3"
    >
      <p className="flex items-start gap-2 text-body-sm text-[#B45309]">
        <WarningIcon />
        <span>
          Verify your email to secure your account
          {email ? <span className="break-all"> — we sent a link to {email}.</span> : "."}
        </span>
      </p>
      <button
        type="button"
        onClick={() => resend.mutate()}
        disabled={resend.isPending}
        className="text-body-sm font-semibold text-[#B45309] underline hover:no-underline disabled:opacity-60"
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
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-info/30 bg-info/10 px-4 py-3"
    >
      <p className="flex items-start gap-2 text-body-sm text-ink">
        <InfoIcon />
        <span>You checked out as a guest — secure your account to track orders.</span>
      </p>
      <button
        type="button"
        onClick={() => openAuth({ view: "claim" })}
        className="text-body-sm font-semibold text-volt-600 underline hover:no-underline"
      >
        Activate
      </button>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-0.5 shrink-0">
      <path d="M8 1.5 15 14H1L8 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 6v3.5M8 12h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="mt-0.5 shrink-0 text-info">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.5v3.5M8 5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
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
