"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { auth, type OtpPurpose } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import {
  isValidBdNational,
  normalizeNationalDigits,
  toE164,
} from "@/lib/auth/phone";
import { TextField } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { useAuthUi } from "@/lib/stores/auth-ui";

/**
 * Step 1 of the phone-OTP flow (phone-otp-login §5 phone input, §6 states).
 * Validates a BD mobile, requests an OTP, then hands the challenge to OtpStep.
 */
export function PhoneStep({
  purpose = "login",
  initialNational = "",
  onSent,
}: {
  purpose?: OtpPurpose;
  initialNational?: string;
  onSent: (data: { phone: string; challengeId: string; resendAfter: number }) => void;
}) {
  const setView = useAuthUi((s) => s.setView);
  const prefillEmail = useAuthUi((s) => s.prefillEmail);
  const [national, setNational] = useState(initialNational);
  const [formError, setFormError] = useState<string | null>(null);

  const valid = isValidBdNational(national);

  const request = useMutation({
    mutationFn: () => auth.requestOtp(toE164(national), purpose),
    onSuccess: (data) => {
      setFormError(null);
      onSent({
        phone: toE164(national),
        challengeId: data.challenge_id,
        resendAfter: data.resend_after ?? 60,
      });
    },
    onError: (err) => {
      if (isApiError(err)) {
        if (err.status === 429) {
          const mins = err.retryAfter ? Math.ceil(err.retryAfter / 60) : null;
          setFormError(
            mins
              ? `You've requested too many codes. Try again in ~${mins} min.`
              : "You've requested too many codes. Please try again later.",
          );
          return;
        }
        if (err.status === 503) {
          setFormError(
            "We couldn't send your code right now. Please try again in a moment.",
          );
          return;
        }
        if (err.status === 0) {
          setFormError("You're offline. Check your connection and try again.");
          return;
        }
      }
      setFormError("Something went wrong. Please try again.");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) request.mutate();
      }}
      className="space-y-4"
      noValidate
    >
      <TextField
        label="Mobile number"
        prefix="+880"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="1XXXXXXXXX"
        value={national}
        disabled={request.isPending}
        onChange={(e) => setNational(normalizeNationalDigits(e.target.value))}
        error={national.length > 0 && !valid ? "Enter a valid Bangladeshi mobile number." : undefined}
        helper="We'll text you a 6-digit code."
      />

      {formError && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-md bg-warning/15 px-3 py-2 text-body-sm text-[#B45309]"
        >
          {formError}
        </p>
      )}

      <Button type="submit" pending={request.isPending} disabled={!valid}>
        {request.isPending ? "Sending…" : "Continue"}
      </Button>

      <button
        type="button"
        onClick={() => setView("email-login", prefillEmail)}
        className="block w-full text-center text-body-sm font-medium text-volt-600 hover:underline"
      >
        Use email instead
      </button>

      <LegalLine />
    </form>
  );
}

export function LegalLine() {
  return (
    <p className="text-center text-body-sm text-text-faint">
      By continuing you agree to our{" "}
      <a href="/terms" className="underline hover:text-text-muted">Terms</a> and{" "}
      <a href="/privacy" className="underline hover:text-text-muted">Privacy Policy</a>.
    </p>
  );
}
