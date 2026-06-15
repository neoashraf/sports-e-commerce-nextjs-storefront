"use client";

import Link from "next/link";

import { Sheet } from "@/components/ui/Sheet";
import { useAuthUi, type AuthView } from "@/lib/stores/auth-ui";
import { PhoneFlow } from "@/components/auth/PhoneFlow";
import { EmailLoginForm } from "@/components/auth/EmailLoginForm";
import { EmailRegisterForm } from "@/components/auth/EmailRegisterForm";
import { ResetRequest } from "@/components/auth/ResetRequest";
import { ClaimFlow } from "@/components/auth/ClaimFlow";

/**
 * Global auth overlay (phone-otp-login §3): one bottom-sheet/modal that hosts
 * every auth view. Mounted once in the root layout; opened via useAuthUi /
 * useAuth(). Not a routed page — invocable from anywhere.
 */

const TITLES: Record<AuthView, string> = {
  phone: "Log in or sign up",
  "email-login": "Log in with email",
  "email-register": "Create your account",
  "reset-request": "Reset your password",
  claim: "Secure your account",
};

export function AuthSheet() {
  const { open, view, closeAuth } = useAuthUi();

  return (
    <Sheet open={open} onClose={closeAuth} title={TITLES[view]}>
      {view === "phone" && <PhoneFlow />}
      {view === "email-login" && <EmailLoginForm />}
      {view === "email-register" && <EmailRegisterForm />}
      {view === "reset-request" && <ResetRequest />}
      {view === "claim" && <ClaimFlow />}

      {/* Guests who only want to check an order shouldn't have to sign up: a shortcut to the public
          tracking page. Closes the sheet on navigate. */}
      <div className="mt-5 border-t border-border pt-4 text-center">
        <Link
          href="/track"
          onClick={closeAuth}
          className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-ink underline decoration-volt-600 decoration-2 underline-offset-4 hover:text-ink-700"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 7h13l5 5v5h-3" />
            <path d="M3 7v10h2" />
            <circle cx="7.5" cy="17.5" r="1.5" />
            <circle cx="17.5" cy="17.5" r="1.5" />
          </svg>
          Track your order
        </Link>
      </div>
    </Sheet>
  );
}
