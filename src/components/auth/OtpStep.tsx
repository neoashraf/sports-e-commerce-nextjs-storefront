"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { auth, type OtpPurpose } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import { maskPhone } from "@/lib/auth/phone";
import { OtpInput } from "@/components/auth/OtpInput";
import { TextField } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { useCountdown } from "@/lib/hooks/useCountdown";

/**
 * Step 2 of the phone-OTP flow (phone-otp-login §5 OTP input + §6 states): code
 * entry, verify, wrong/expired/too-many handling, resend cooldown, and the
 * name sub-step revealed on `409 full_name required` (new phone → register).
 *
 * `verify` is injected so this component serves both phone-login (verifyOtp) and
 * account-claim (claimAccount).
 */
export function OtpStep<T>({
  phone,
  challengeId,
  resendAfter,
  purpose = "login",
  collectName = true,
  verify,
  onVerified,
  onEditNumber,
}: {
  phone: string;
  challengeId: string;
  resendAfter: number;
  purpose?: OtpPurpose;
  /** Whether a 409 should reveal the name sub-step (phone-login) or not (claim). */
  collectName?: boolean;
  verify: (args: { challengeId: string; code: string; fullName?: string }) => Promise<T>;
  onVerified: (result: T) => void;
  onEditNumber: () => void;
}) {
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState(challengeId);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [fullName, setFullName] = useState("");
  const liveRef = useRef<HTMLParagraphElement>(null);
  const countdown = useCountdown();

  // Start the resend cooldown on mount.
  useEffect(() => {
    countdown.start(resendAfter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyMutation = useMutation({
    mutationFn: (args: { code: string; fullName?: string }) =>
      verify({ challengeId: challenge, code: args.code, fullName: args.fullName }),
    onSuccess: (result) => onVerified(result),
    onError: (err) => {
      if (isApiError(err)) {
        // New phone needs a name → reveal the sub-step and resubmit with it.
        if (err.status === 409 && collectName) {
          setNeedsName(true);
          setOtpError(null);
          return;
        }
        if (err.status === 423) {
          setOtpError("Too many tries. Request a new code.");
          setCode("");
          triggerShake();
          return;
        }
        if (err.status === 400) {
          const expired = /expire/i.test(err.message);
          setOtpError(expired ? "This code has expired." : "Incorrect code. Please try again.");
          setCode("");
          triggerShake();
          return;
        }
        if (err.status === 0) {
          setOtpError("You're offline. Check your connection and try again.");
          return;
        }
      }
      setOtpError("Something went wrong. Please try again.");
    },
  });

  const resend = useMutation({
    mutationFn: () => auth.requestOtp(phone, purpose),
    onSuccess: (data) => {
      setChallenge(data.challenge_id);
      setCode("");
      setOtpError(null);
      countdown.start(data.resend_after ?? 60);
    },
    onError: (err) => {
      if (isApiError(err) && err.status === 429) {
        const mins = err.retryAfter ? Math.ceil(err.retryAfter / 60) : null;
        setOtpError(mins ? `Try again in ~${mins} min.` : "Please wait before requesting another code.");
      } else if (isApiError(err) && err.status === 503) {
        setOtpError("We couldn't send your code right now. Please try again in a moment.");
      } else {
        setOtpError("Couldn't resend the code. Please try again.");
      }
    },
  });

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 220);
  }

  // Auto-submit on the 6th digit (guard against double-submit while in flight).
  const submitCode = (value: string) => {
    if (verifyMutation.isPending) return;
    setOtpError(null);
    verifyMutation.mutate({ code: value });
  };

  const submitWithName = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) return;
    verifyMutation.mutate({ code, fullName: fullName.trim() });
  };

  return (
    <div className="space-y-4">
      <p ref={liveRef} aria-live="polite" className="text-body-sm text-text-muted">
        Code sent to {maskPhone(phone)}.
      </p>

      <div className={shake ? "animate-shake" : undefined}>
        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={submitCode}
          disabled={verifyMutation.isPending || needsName}
          error={!!otpError}
        />
      </div>

      {otpError && (
        <p role="alert" aria-live="assertive" className="text-body-sm text-error">
          {otpError}
        </p>
      )}

      {needsName ? (
        <form onSubmit={submitWithName} className="space-y-3" noValidate>
          <TextField
            label="What should we call you?"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            helper="Shown on your orders."
            autoComplete="name"
            maxLength={120}
            autoFocus
          />
          <Button type="submit" pending={verifyMutation.isPending} disabled={fullName.trim().length < 2}>
            {verifyMutation.isPending ? "Creating account…" : "Create account"}
          </Button>
        </form>
      ) : (
        <Button
          type="button"
          pending={verifyMutation.isPending}
          disabled={code.length < 6}
          onClick={() => submitCode(code)}
        >
          {verifyMutation.isPending ? "Verifying…" : "Verify"}
        </Button>
      )}

      <div className="flex items-center justify-between text-body-sm">
        <button
          type="button"
          onClick={onEditNumber}
          className="font-medium text-text-muted transition-colors duration-micro ease-out hover:text-ink"
        >
          ‹ Edit number
        </button>
        {countdown.isRunning ? (
          <span className="text-text-faint">Resend in {countdown.mmss}</span>
        ) : (
          <button
            type="button"
            onClick={() => resend.mutate()}
            disabled={resend.isPending}
            className="font-medium text-volt-600 hover:underline disabled:opacity-60"
          >
            {resend.isPending ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>
    </div>
  );
}
