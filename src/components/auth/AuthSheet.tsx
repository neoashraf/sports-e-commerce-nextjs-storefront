"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Sheet } from "@/components/ui/Sheet";
import { useAuthUi, type AuthView } from "@/lib/stores/auth-ui";
import { PhoneFlow } from "@/components/auth/PhoneFlow";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
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
  const pathname = usePathname();

  // Close the overlay on any client-side navigation (e.g. the Terms / Privacy
  // links in the legal line, or the Track-order shortcut). Keyed on pathname so
  // it fires only when the route actually changes — never on open. Guarded by
  // `open` so an already-closed sheet doesn't clear an unrelated pending action.
  useEffect(() => {
    if (useAuthUi.getState().open) closeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Sheet open={open} onClose={closeAuth} title={TITLES[view]}>
      {view === "phone" && <PhoneFlow />}
      {view === "email-login" && <EmailLoginForm />}
      {view === "email-register" && <EmailRegisterForm />}
      {view === "reset-request" && <ResetRequest />}
      {view === "claim" && <ClaimFlow />}

      {/* Social sign-in — available on the login/register entry views (not on reset/claim). */}
      {(view === "phone" || view === "email-login" || view === "email-register") && (
        <div className="mt-4">
          <GoogleSignInButton />
        </div>
      )}

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
