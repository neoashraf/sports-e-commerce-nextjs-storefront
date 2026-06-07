"use client";

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
    </Sheet>
  );
}
