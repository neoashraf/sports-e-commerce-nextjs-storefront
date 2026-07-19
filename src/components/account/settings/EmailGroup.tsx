"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, me as meApi } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import { formatRetryAfter } from "@/lib/format";
import { patchCustomer } from "@/lib/auth/session";
import { meKeys } from "@/lib/api/hooks/useMe";
import type { CustomerDto, EmailChangeRequestDto } from "@/lib/api/schemas/auth";
import { SettingsCard, VerifyBadge } from "./SettingsCard";
import { TextField } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { OtpInput } from "@/components/auth/OtpInput";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { toast } from "@/lib/stores/toast";

/**
 * Email: value + verify badge + verify-before-attach add/change (FR-AUTH-041/044/046).
 * The requested address is PENDING only — a code goes to that inbox and the account
 * changes exclusively on confirm (attached already verified). Expired/abandoned
 * requests leave the account untouched (edge 16). Confirming revokes other sessions
 * (BR-AUTH-5) — the success copy says so. The registration verify-link resend for a
 * legacy unverified email is unchanged.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailGroup({ profile }: { profile: CustomerDto }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [pending, setPending] = useState<EmailChangeRequestDto | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const expiry = useCountdown();

  const normalized = address.trim().toLowerCase();
  const addressValid = EMAIL_RE.test(normalized);

  const request = useMutation({
    mutationFn: () => meApi.requestEmailChange(normalized),
    onSuccess: (data) => {
      setPending(data);
      setCode("");
      setError(null);
      expiry.start(data.expires_in);
    },
    onError: (err) => {
      if (isApiError(err) && err.status === 409) {
        setError("This email is already in use by another account.");
        return;
      }
      if (isApiError(err) && err.status === 429) {
        setError(`Please wait ${formatRetryAfter(err.retryAfter) ?? "a moment"} before requesting another code.`);
        return;
      }
      setError("Couldn't send the code. Please try again.");
    },
  });

  const confirm = useMutation({
    mutationFn: () => meApi.confirmEmailChange((pending as EmailChangeRequestDto).request_id, code),
    onSuccess: (data) => {
      // Attached already verified (FR-AUTH-041) — no unverified interim.
      patchCustomer({ email: data.email, email_verified: data.email_verified });
      void qc.invalidateQueries({ queryKey: meKeys.me });
      toast("Email updated. Other devices have been signed out.");
      close();
    },
    onError: (err) => {
      if (isApiError(err) && err.status === 409) {
        // Claimed meanwhile (FR-AUTH-044, edge 5): nothing attached — restart.
        setPending(null);
        setCode("");
        setError("That email was just taken by another account. Try a different address.");
        return;
      }
      if (isApiError(err) && err.code === "EMAIL_CHANGE_EXPIRED") {
        setPending(null);
        setCode("");
        setError("That code expired. Request a new one.");
        return;
      }
      setError("Incorrect code. Please try again.");
    },
  });

  const close = () => {
    setOpen(false);
    setAddress("");
    setPending(null);
    setCode("");
    setError(null);
  };

  return (
    <SettingsCard id="email" title="Email">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="break-all text-body-sm text-ink">{profile.email || "No email added"}</p>
          {profile.email && <VerifyBadge verified={!!profile.email_verified} />}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" fullWidth={false} onClick={() => setOpen(true)}>
            {profile.email ? "Change" : "Add email"}
          </Button>
          {profile.email && !profile.email_verified && <ResendVerifyButton />}
        </div>
      </div>

      <Sheet open={open} onClose={close} title={profile.email ? "Change email" : "Add email"}>
        {!pending ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (addressValid) request.mutate();
            }}
            className="space-y-4"
            noValidate
          >
            <TextField
              label="New email"
              type="email"
              autoComplete="email"
              helper="We'll email a code to confirm it's yours. Nothing changes until you enter it."
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setError(null);
              }}
              error={error ?? (address.length > 0 && !addressValid ? "Enter a valid email." : undefined)}
            />
            {profile.email && (
              <p className="text-label text-text-muted">
                We&apos;ll notify {profile.email} after the change.
              </p>
            )}
            <Button type="submit" pending={request.isPending} disabled={!addressValid}>
              {request.isPending ? "Sending…" : "Send code"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-body-sm text-text-muted">
              Enter the code we emailed to {pending.sent_to}.
              {expiry.isRunning && <span className="text-text-faint"> Expires in {expiry.mmss}.</span>}
            </p>
            <OtpInput
              value={code}
              onChange={(next) => {
                setCode(next);
                setError(null);
              }}
              onComplete={() => confirm.mutate()}
              error={!!error}
              disabled={confirm.isPending}
            />
            {error && (
              <p role="alert" className="text-body-sm text-error">
                {error}
              </p>
            )}
            <Button pending={confirm.isPending} disabled={code.length < 6} onClick={() => confirm.mutate()}>
              {confirm.isPending ? "Verifying…" : "Confirm"}
            </Button>
            <button
              type="button"
              onClick={() => request.mutate()}
              disabled={request.isPending}
              className="text-body-sm font-semibold text-volt-600 underline hover:no-underline disabled:opacity-60"
            >
              {request.isPending ? "Sending…" : "Didn't get it? Send a new code"}
            </button>
          </div>
        )}
      </Sheet>
    </SettingsCard>
  );
}

/** Resend of the registration verify LINK for a legacy unverified address (FR-AUTH-043). */
function ResendVerifyButton() {
  const resend = useMutation({
    mutationFn: () => auth.resendVerifyEmail(),
    onSuccess: () => toast("Verification email sent."),
    onError: () => toast("Couldn't resend right now.", "error"),
  });
  return (
    <Button variant="ghost" fullWidth={false} pending={resend.isPending} onClick={() => resend.mutate()}>
      Resend verification
    </Button>
  );
}
