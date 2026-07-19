"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { me as meApi } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import { formatRetryAfter } from "@/lib/format";
import { passwordSchema } from "@/lib/auth/password";
import type { PasswordSetRequestDto } from "@/lib/api/schemas/auth";
import { patchCustomer } from "@/lib/auth/session";
import { meKeys } from "@/lib/api/hooks/useMe";
import { useAuthStore } from "@/lib/stores/auth";
import { useDevOtp } from "@/lib/stores/dev-otp";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { useId } from "react";
import { OtpInput } from "@/components/auth/OtpInput";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { PasswordField } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";

/**
 * First-password set flow (FR-AUTH-036/037): request → (OTP entry when required —
 * skipped inside the 10-minute freshness window, e.g. right after OTP-gated
 * checkout) → new password → done. One `POST /me/password/set` carries the code
 * (or `set_token`) together with the password, matching contract 01 exactly.
 * Shared by the Settings card and the order-confirmation CTA (FR-AUTH-074).
 */
export function SetPasswordFlow({
  startLabel = "Set a password",
  onDone,
}: {
  /** Label for the initial button (the confirmation CTA uses its own copy). */
  startLabel?: string;
  /** Called after the password is created (e.g. collapse the CTA card). */
  onDone?: () => void;
}) {
  const qc = useQueryClient();
  const phone = useAuthStore((s) => s.customer?.phone);
  const showDevOtp = useDevOtp((s) => s.show);
  const resendCountdown = useCountdown();
  const checklistId = useId();

  const [grant, setGrant] = useState<PasswordSetRequestDto | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const request = useMutation({
    mutationFn: () => meApi.requestPasswordSet(),
    onSuccess: (data) => {
      setGrant(data);
      setCode("");
      setError(null);
      if (data.otp_required && data.resend_after) resendCountdown.start(data.resend_after);
      if (data.dev_otp) showDevOtp(data.dev_otp, phone ?? undefined);
    },
    onError: (err) => {
      if (isApiError(err) && err.status === 409 && err.code === "PASSWORD_EXISTS") {
        // Already has one (stale UI) — sync the store and collapse.
        patchCustomer({ has_password: true });
        void qc.invalidateQueries({ queryKey: meKeys.me });
        setError(null);
        return;
      }
      if (isApiError(err) && err.status === 429) {
        setError(`Please wait ${formatRetryAfter(err.retryAfter) ?? "a moment"} before requesting another code.`);
        if (err.retryAfter) resendCountdown.start(err.retryAfter);
        return;
      }
      if (isApiError(err) && err.status === 409 && err.code === "PHONE_REQUIRED") {
        setError("Add and verify a phone number first.");
        return;
      }
      setError("Couldn't start. Please try again.");
    },
  });

  const submit = useMutation({
    mutationFn: () => {
      const proof = grant?.otp_required
        ? { challenge_id: grant.challenge_id, code }
        : { set_token: grant?.set_token };
      return meApi.setPassword({ ...proof, new_password: password });
    },
    onSuccess: () => {
      patchCustomer({ has_password: true });
      void qc.invalidateQueries({ queryKey: meKeys.me });
      toast("Password created. You can now log in with email + password.");
      setDone(true);
      onDone?.();
    },
    onError: (err) => {
      if (!isApiError(err)) {
        setError("Something went wrong. Please try again.");
        return;
      }
      switch (err.code) {
        case "INVALID_OTP":
          setError("Incorrect code. Please try again.");
          break;
        case "OTP_EXPIRED":
          setError("That code has expired — request a new one.");
          break;
        case "OTP_CONSUMED":
          setError("That code was already used — request a new one.");
          break;
        case "OTP_LOCKED":
          setError("Too many attempts. Request a new code.");
          break;
        case "SET_TOKEN_INVALID":
          // Freshness token expired — fall back to the OTP path.
          setGrant(null);
          setError("That took a little too long — we'll text you a code instead.");
          break;
        case "WEAK_PASSWORD":
          setError("Password must be at least 8 characters and include a letter and a number.");
          break;
        case "PASSWORD_EXISTS":
          patchCustomer({ has_password: true });
          void qc.invalidateQueries({ queryKey: meKeys.me });
          setDone(true);
          break;
        default:
          setError("Couldn't save the password. Please try again.");
      }
    },
  });

  if (done) {
    return (
      <p role="status" className="text-body-sm font-semibold text-success">
        Password set — you&apos;re all done.
      </p>
    );
  }

  if (!grant) {
    return (
      <div className="space-y-2">
        <Button
          variant="secondary"
          fullWidth={false}
          pending={request.isPending}
          onClick={() => request.mutate()}
        >
          {request.isPending ? "Starting…" : startLabel}
        </Button>
        {error && (
          <p role="alert" className="text-body-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  }

  const passwordOk = passwordSchema.safeParse(password).success;
  const canSubmit = passwordOk && (!grant.otp_required || code.length === 6);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) submit.mutate();
      }}
      className="space-y-4"
      noValidate
    >
      {grant.otp_required ? (
        <div className="space-y-2">
          <p className="text-body-sm text-text-muted">
            Enter the code we texted to {phone ?? "your phone"}.
          </p>
          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={() => undefined}
            error={!!error}
            disabled={submit.isPending}
          />
          <button
            type="button"
            onClick={() => request.mutate()}
            disabled={resendCountdown.isRunning || request.isPending}
            className="text-body-sm font-semibold text-volt-600 underline hover:no-underline disabled:no-underline disabled:opacity-60"
          >
            {resendCountdown.isRunning ? `Resend in ${resendCountdown.mmss}` : request.isPending ? "Sending…" : "Resend code"}
          </button>
        </div>
      ) : (
        <p className="text-body-sm text-text-muted">
          Your phone was just verified — no code needed. Choose a password:
        </p>
      )}

      <div className="space-y-2">
        <PasswordField
          label="New password"
          autoComplete="new-password"
          describedBy={checklistId}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordChecklist id={checklistId} value={password} />
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      )}

      <Button type="submit" pending={submit.isPending} disabled={!canSubmit}>
        {submit.isPending ? "Saving…" : "Create password"}
      </Button>
    </form>
  );
}
