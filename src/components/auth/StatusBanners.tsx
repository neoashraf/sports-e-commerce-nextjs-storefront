"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { auth } from "@/lib/api";
import { toast } from "@/lib/stores/toast";
import { useAuthStore } from "@/lib/stores/auth";

/**
 * Account-health banners (account-home §5 / email-register §6). Shown until
 * resolved: verify-email when `email_verified=false`; finish-account when
 * `has_password=false` (FR-AUTH-036 — replaces the retired claim banner).
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

export function FinishAccountBanner() {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-info/30 bg-info/10 px-4 py-3"
    >
      <p className="flex items-start gap-2 text-body-sm text-ink">
        <InfoIcon />
        <span>Finish your account — create a password to also log in with email.</span>
      </p>
      <Link
        href="/account/settings#password"
        className="text-body-sm font-semibold text-volt-600 underline hover:no-underline"
      >
        Set a password
      </Link>
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
      {customer.has_password === false && <FinishAccountBanner />}
      {customer.email && customer.email_verified === false && (
        <VerifyEmailBanner email={customer.email} />
      )}
    </div>
  );
}
