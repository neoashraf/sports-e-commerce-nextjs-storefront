"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { auth } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import { formatRetryAfter } from "@/lib/format";
import { commitSession } from "@/lib/auth/session";
import { consumePendingAction } from "@/lib/auth/pending-action";
import { toast } from "@/lib/stores/toast";
import { useAuthUi } from "@/lib/stores/auth-ui";
import type { MfaChannel, MfaChallengeDto } from "@/lib/api/schemas/auth";
import { OtpInput } from "@/components/auth/OtpInput";
import { Button } from "@/components/ui/Button";
import { useCountdown } from "@/lib/hooks/useCountdown";

const CHANNEL_LABEL: Record<MfaChannel, string> = { sms: "SMS", email: "email" };

/**
 * Login second-factor step (mfa-login-step §5/§6). Shown after a correct email+password on a
 * 2FA account: enter the 6-digit code → verify → session issued. Handles resend (cooldown/cap),
 * channel switch ("send to email/SMS instead"), wrong/expired/locked, and pre-auth expiry
 * (FR-MFA-013–022). Reads the pre-auth token + challenge from the auth-ui store.
 */
export function MfaStep() {
  const { mfaPreAuth, mfaChallenge, mfaChannels, setView, closeAuth } = useAuthUi();
  const [challenge, setChallenge] = useState<MfaChallengeDto | undefined>(mfaChallenge);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const countdown = useCountdown();

  useEffect(() => {
    countdown.start(mfaChallenge?.resend_after ?? 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 220);
  }
  function expiredSignIn() {
    setError(null);
    setView("email-login");
  }

  const verify = useMutation({
    mutationFn: (value: string) => auth.mfaVerify(mfaPreAuth ?? "", value),
    onSuccess: (res) => {
      if ("mfa_required" in res) return; // not expected from verify
      commitSession(res.customer, res.tokens);
      toast("Signed in");
      closeAuth();
      consumePendingAction();
    },
    onError: (err) => {
      setCode("");
      if (isApiError(err)) {
        if (err.status === 401) return expiredSignIn(); // pre-auth invalid (FR-MFA-015)
        if (err.status === 423) { setError("Too many tries. Please sign in again."); triggerShake(); return; }
        if (err.status === 400) {
          setError(/expire/i.test(err.message) ? "This code has expired." : "Incorrect code. Please try again.");
          triggerShake();
          return;
        }
        if (err.status === 0) { setError("You're offline. Check your connection and try again."); return; }
      }
      setError("Something went wrong. Please try again.");
    },
  });

  const resend = useMutation({
    mutationFn: () => auth.mfaResend(mfaPreAuth ?? ""),
    onSuccess: (res) => {
      setChallenge(res.challenge);
      setCode("");
      setError(null);
      countdown.start(res.challenge.resend_after ?? 60);
    },
    onError: (err) => {
      if (isApiError(err) && err.status === 429) {
        const wait = formatRetryAfter(err.retryAfter);
        setError(wait ? `Try again in ${wait}.` : "Please wait before requesting another code.");
      } else if (isApiError(err) && err.status === 401) {
        expiredSignIn();
      } else if (isApiError(err) && err.status === 503) {
        setError("We couldn't send your code right now. Try another channel or again in a moment.");
      } else {
        setError("Couldn't resend the code. Please try again.");
      }
    },
  });

  const switchChannel = useMutation({
    mutationFn: (channel: MfaChannel) => auth.mfaChannel(mfaPreAuth ?? "", channel, true),
    onSuccess: (res) => {
      setChallenge(res.challenge);
      setCode("");
      setError(null);
      countdown.start(res.challenge.resend_after ?? 60);
    },
    onError: (err) => {
      if (isApiError(err) && err.status === 401) expiredSignIn();
      else if (isApiError(err) && err.status === 503) setError("We couldn't send to that channel. Try again.");
      else setError("Couldn't switch channel. Please try again.");
    },
  });

  // The pre-auth token/challenge is required; if it's missing (e.g. page refresh), bounce to sign-in.
  if (!mfaPreAuth || !challenge) {
    return (
      <div className="space-y-4">
        <p className="text-body-sm text-error">Your sign-in expired. Please sign in again.</p>
        <Button type="button" onClick={() => setView("email-login")}>Back to sign in</Button>
      </div>
    );
  }

  const otherChannel = (mfaChannels ?? []).find((c) => c !== challenge.channel);

  const submit = (value: string) => {
    if (verify.isPending) return;
    setError(null);
    verify.mutate(value);
  };

  return (
    <div className="space-y-4">
      <p ref={liveRef} aria-live="polite" className="text-body-sm text-text-muted">
        Enter the 6-digit code we sent to <span className="font-medium text-ink">{challenge.sent_to}</span>.
      </p>

      <div className={shake ? "animate-shake" : undefined}>
        <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={verify.isPending} error={!!error} />
      </div>

      {error && (
        <p role="alert" aria-live="assertive" className="text-body-sm text-error">{error}</p>
      )}

      <Button type="button" pending={verify.isPending} disabled={code.length < 6} onClick={() => submit(code)}>
        {verify.isPending ? "Verifying…" : "Verify"}
      </Button>

      {otherChannel && (
        <button
          type="button"
          onClick={() => switchChannel.mutate(otherChannel)}
          disabled={switchChannel.isPending}
          className="block w-full text-center text-body-sm font-medium text-volt-600 hover:underline disabled:opacity-60"
        >
          {switchChannel.isPending ? "Sending…" : `Send to ${CHANNEL_LABEL[otherChannel]} instead`}
        </button>
      )}

      <div className="flex items-center justify-between text-body-sm">
        <button
          type="button"
          onClick={() => setView("email-login")}
          className="font-medium text-text-muted transition-colors duration-micro ease-out hover:text-ink"
        >
          ‹ Back to sign in
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
