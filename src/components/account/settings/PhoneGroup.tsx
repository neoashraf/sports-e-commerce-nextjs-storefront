"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { me as meApi } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import {
  isValidBdNational,
  normalizeNationalDigits,
  toE164,
} from "@/lib/auth/phone";
import { patchCustomer } from "@/lib/auth/session";
import { meKeys } from "@/lib/api/hooks/useMe";
import type { CustomerDto } from "@/lib/api/schemas/auth";
import { SettingsCard, VerifyBadge } from "./SettingsCard";
import { TextField } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { OtpInput } from "@/components/auth/OtpInput";
import { toast } from "@/lib/stores/toast";

/**
 * Phone change with OTP verification of the NEW number (FR-AUTH-042). The new
 * number only replaces the old after the code is confirmed; `409` if it's
 * already registered to another account.
 */
export function PhoneGroup({ profile }: { profile: CustomerDto }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [national, setNational] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const requestChange = useMutation({
    mutationFn: () => meApi.requestPhoneChange(toE164(national)),
    onSuccess: (data) => { setChallengeId(data.challenge_id); setError(null); },
    onError: (err) => {
      setError(
        isApiError(err) && err.status === 409
          ? "This number is already in use."
          : "Couldn't send a code. Please try again.",
      );
    },
  });

  const confirmChange = useMutation({
    mutationFn: () => meApi.confirmPhoneChange(challengeId as string, code),
    onSuccess: (data) => {
      patchCustomer({ phone: data.phone, phone_verified: data.phone_verified });
      qc.invalidateQueries({ queryKey: meKeys.me });
      toast("Saved.");
      close();
    },
    onError: () => setError("Incorrect code. Please try again."),
  });

  const close = () => {
    setOpen(false);
    setNational("");
    setChallengeId(null);
    setCode("");
    setError(null);
  };

  return (
    <SettingsCard id="phone" title="Phone">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="break-words text-body-sm text-ink">{profile.phone || "No phone added"}</p>
        {profile.phone && <VerifyBadge verified={!!profile.phone_verified} />}
      </div>
      <Button variant="secondary" fullWidth={false} className="mt-3" onClick={() => setOpen(true)}>
        {profile.phone ? "Change" : "Add phone"}
      </Button>

      <Sheet open={open} onClose={close} title="Change phone number">
        {!challengeId ? (
          <form
            onSubmit={(e) => { e.preventDefault(); if (isValidBdNational(national)) requestChange.mutate(); }}
            className="space-y-4"
            noValidate
          >
            <TextField
              label="New mobile number"
              prefix="+880"
              inputMode="numeric"
              placeholder="1XXXXXXXXX"
              helper="We'll text a code to confirm."
              value={national}
              onChange={(e) => setNational(normalizeNationalDigits(e.target.value))}
              error={error ?? (national.length > 0 && !isValidBdNational(national) ? "Enter a valid Bangladeshi mobile number." : undefined)}
            />
            <Button type="submit" pending={requestChange.isPending} disabled={!isValidBdNational(national)}>
              {requestChange.isPending ? "Sending…" : "Send code"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-body-sm text-text-muted">Enter the code sent to +880{national}.</p>
            <OtpInput value={code} onChange={setCode} onComplete={() => confirmChange.mutate()} error={!!error} disabled={confirmChange.isPending} />
            {error && <p role="alert" className="text-body-sm text-error">{error}</p>}
            <Button pending={confirmChange.isPending} disabled={code.length < 6} onClick={() => confirmChange.mutate()}>
              {confirmChange.isPending ? "Verifying…" : "Confirm"}
            </Button>
          </div>
        )}
      </Sheet>
    </SettingsCard>
  );
}
