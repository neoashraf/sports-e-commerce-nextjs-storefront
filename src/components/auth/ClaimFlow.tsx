"use client";

import { useEffect, useId, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { auth } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import { isPasswordValid } from "@/lib/auth/password";
import { maskPhone } from "@/lib/auth/phone";
import { commitSession, patchCustomer } from "@/lib/auth/session";
import { consumePendingAction } from "@/lib/auth/pending-action";
import { toast } from "@/lib/stores/toast";
import { useAuthStore } from "@/lib/stores/auth";
import { useAuthUi } from "@/lib/stores/auth-ui";
import { OtpInput } from "@/components/auth/OtpInput";
import { PasswordField } from "@/components/ui/fields";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { Button } from "@/components/ui/Button";
import { useCountdown } from "@/lib/hooks/useCountdown";

/**
 * Claim / activate a lightweight account (account-claim brief). Sends an OTP to
 * the account's own phone (purpose: register), then POST /auth/account/claim
 * with the code (+ optional password). Reuses the OTP input; `409` →
 * "already a full account, log in instead". "Skip for now" leaves it lightweight.
 */
export function ClaimFlow() {
  const closeAuth = useAuthUi((s) => s.closeAuth);
  const setView = useAuthUi((s) => s.setView);
  const customer = useAuthStore((s) => s.customer);
  const phone = customer?.phone ?? null;

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [resendAfter, setResendAfter] = useState(60);
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [alreadyFull, setAlreadyFull] = useState(false);
  const countdown = useCountdown();
  const pwId = useId();

  const sendOtp = useMutation({
    mutationFn: () => auth.requestOtp(phone as string, "register"),
    onSuccess: (data) => {
      setChallengeId(data.challenge_id);
      setResendAfter(data.resend_after ?? 60);
      countdown.start(data.resend_after ?? 60);
      setOtpError(null);
    },
    onError: (err) => {
      if (isApiError(err) && err.status === 503) {
        setOtpError("We couldn't send your code right now. Please try again in a moment.");
      } else if (isApiError(err) && err.status === 429) {
        setOtpError("Too many code requests. Try again in a few minutes.");
      } else {
        setOtpError("Couldn't send the code. Please try again.");
      }
    },
  });

  // Auto-send the OTP to the account's phone on open.
  useEffect(() => {
    if (phone && !challengeId && !sendOtp.isPending) sendOtp.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const claim = useMutation({
    mutationFn: (args: { code: string; password?: string }) =>
      auth.claimAccount({
        challenge_id: challengeId as string,
        code: args.code,
        password: args.password,
      }),
    onSuccess: (res) => {
      commitSession(res.customer, res.tokens);
      patchCustomer({ is_lightweight: false, phone_verified: true });
      toast("Your account is ready.");
      closeAuth();
      consumePendingAction();
    },
    onError: (err) => {
      if (isApiError(err)) {
        if (err.status === 409) {
          setAlreadyFull(true);
          return;
        }
        if (err.status === 423) {
          setOtpError("Too many tries. Request a new code.");
          setCode("");
          return;
        }
        if (err.status === 400) {
          setOtpError(/expire/i.test(err.message) ? "This code has expired." : "Incorrect code. Please try again.");
          setCode("");
          return;
        }
      }
      setOtpError("Something went wrong. Please try again.");
    },
  });

  const submit = (value: string) => {
    if (claim.isPending) return;
    if (showPassword && password && !isPasswordValid(password)) return;
    setOtpError(null);
    claim.mutate({ code: value, password: showPassword && password ? password : undefined });
  };

  if (!phone) {
    return (
      <p className="text-sm text-gray-600">
        We couldn&apos;t find a phone number on your account to verify.
      </p>
    );
  }

  if (alreadyFull) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-700">You already have an account.</p>
        <Button onClick={() => setView("email-login")}>Log in instead</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Verify your number to save your details and track orders.
      </p>
      <p aria-live="polite" className="text-sm text-gray-600">
        Code sent to {maskPhone(phone)}.
      </p>

      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={submit}
        disabled={claim.isPending || !challengeId}
        error={!!otpError}
      />
      {otpError && (
        <p role="alert" aria-live="assertive" className="text-sm text-red-600">{otpError}</p>
      )}

      <div className="rounded-lg border border-gray-200">
        <button
          type="button"
          aria-expanded={showPassword}
          onClick={() => setShowPassword((s) => !s)}
          className="flex min-h-[44px] w-full items-center justify-between px-3 text-sm font-medium text-gray-800"
        >
          Set a password (optional)
          <span aria-hidden>{showPassword ? "−" : "+"}</span>
        </button>
        {showPassword && (
          <div className="space-y-2 px-3 pb-3">
            <PasswordField
              label="Password"
              autoComplete="new-password"
              describedBy={pwId}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helper="Lets you log in with email + password later."
            />
            <PasswordChecklist id={pwId} value={password} />
          </div>
        )}
      </div>

      <Button
        pending={claim.isPending}
        disabled={code.length < 6 || (showPassword && !!password && !isPasswordValid(password))}
        onClick={() => submit(code)}
      >
        {claim.isPending ? "Verifying…" : showPassword && password ? "Done" : "Verify"}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={closeAuth} className="font-medium text-gray-500 hover:text-gray-700">
          Skip for now
        </button>
        {countdown.isRunning ? (
          <span className="text-gray-400">Resend in {countdown.mmss}</span>
        ) : (
          <button
            type="button"
            onClick={() => sendOtp.mutate()}
            disabled={sendOtp.isPending}
            className="font-medium text-brand-700 hover:underline disabled:opacity-60"
          >
            {sendOtp.isPending ? "Sending…" : "Resend code"}
          </button>
        )}
      </div>
    </div>
  );
}
