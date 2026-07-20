"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { me } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import { formatRetryAfter } from "@/lib/format";
import { toast } from "@/lib/stores/toast";
import type { MfaChannel } from "@/lib/api/schemas/auth";
import { SettingsCard } from "@/components/account/settings/SettingsCard";
import { OtpInput } from "@/components/auth/OtpInput";
import { PasswordField } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";

const CHANNEL_LABEL: Record<MfaChannel, string> = { sms: "SMS", email: "email" };

/**
 * Two-factor authentication settings group (mfa-account-settings §5, hardened per
 * v0.2): enable (channel pick pre-selects the policy `default_channel`, FR-MFA-036)
 * → confirm code; disable = password, plus a fresh code when the backend demands one
 * (session not 2FA-verified → 400 MFA_CODE_REQUIRED sends the code, FR-MFA-002/018);
 * enrollment throttling (`429`) renders as a friendly cooldown (FR-MFA-008). After
 * enable-confirm/disable the copy notes other devices were signed out (FR-MFA-007).
 */
export function TwoFactorGroup() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["me-mfa"], queryFn: () => me.mfa.get(), staleTime: 30_000 });

  const [mode, setMode] = useState<"idle" | "confirm" | "disable" | "disable-code">("idle");
  const [channel, setChannel] = useState<MfaChannel | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string>("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** Where the disable code went (parsed from the backend's MFA_CODE_REQUIRED message). */
  const [disableHint, setDisableHint] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["me-mfa"] });
  const reset = () => {
    setMode("idle");
    setCode("");
    setPassword("");
    setError(null);
    setChallengeId(null);
    setDisableHint(null);
  };

  const throttleMessage = (err: unknown): string | null => {
    if (isApiError(err) && err.status === 429) {
      return `Too many codes requested — try again ${formatRetryAfter(err.retryAfter) ?? "in a bit"}.`;
    }
    return null;
  };

  const enable = useMutation({
    mutationFn: (ch: MfaChannel | undefined) => me.mfa.enable(ch),
    onSuccess: (res) => { setChallengeId(res.verification.challenge_id); setSentTo(res.verification.sent_to); setChannel(res.verification.channel); setCode(""); setError(null); setMode("confirm"); },
    onError: (err) => {
      const throttled = throttleMessage(err);
      if (throttled) setError(throttled);
      else if (isApiError(err) && err.code === "MFA_PASSWORD_REQUIRED") setError("Set a password to use two-factor authentication.");
      else if (isApiError(err) && err.code === "NO_ELIGIBLE_CHANNEL") setError("Verify a phone or email to use two-factor authentication.");
      else setError("Couldn't start setup. Try again.");
    },
  });

  const confirm = useMutation({
    mutationFn: () => me.mfa.confirmEnable(challengeId as string, code),
    onSuccess: () => { toast("Two-factor authentication turned on. Other devices have been signed out."); reset(); refresh(); },
    onError: (err) => { setCode(""); setError(isApiError(err) && /expire/i.test(err.message) ? "This code has expired." : "Incorrect code. Please try again."); },
  });

  const disable = useMutation({
    mutationFn: (withCode: boolean) => me.mfa.disable(password, withCode ? code : undefined),
    onSuccess: () => { toast("Two-factor authentication turned off. Other devices have been signed out."); reset(); refresh(); },
    onError: (err) => {
      if (isApiError(err) && err.status === 401) {
        setMode("disable");
        setError("Current password is incorrect.");
        return;
      }
      if (isApiError(err) && err.code === "MFA_CODE_REQUIRED") {
        // Backend just sent a fresh code (FR-MFA-002) — collect it.
        setDisableHint(err.message);
        setCode("");
        setError(null);
        setMode("disable-code");
        return;
      }
      const throttled = throttleMessage(err);
      if (throttled) {
        setError(throttled);
        if (mode === "disable") setMode("disable-code");
        return;
      }
      if (isApiError(err) && err.code === "CODE_EXPIRED") { setCode(""); setError("This code has expired — send a new one."); return; }
      if (isApiError(err) && err.status === 423) { setCode(""); setError("Too many attempts — send a new code."); return; }
      if (isApiError(err) && err.code === "INVALID_CODE") { setCode(""); setError("Incorrect code. Please try again."); return; }
      setError("Couldn't turn off. Try again.");
    },
  });

  const setPreferred = useMutation({
    mutationFn: (ch: MfaChannel) => me.mfa.setPreferredChannel(ch),
    onSuccess: () => { toast("Preferred channel updated."); refresh(); },
    onError: () => toast("Couldn't update the channel.", "error"),
  });

  if (isLoading || !data) {
    return <SettingsCard title="Two-factor authentication" id="twofactor"><div className="h-16 animate-pulse rounded-md bg-surface-100" /></SettingsCard>;
  }

  const eligible = data.eligible_channels;
  const enabled = data.enabled;
  // Enable pre-select: policy default_channel when eligible (FR-MFA-036), else email-first.
  const defaultChannel: MfaChannel =
    data.policy.default_channel && eligible.includes(data.policy.default_channel)
      ? data.policy.default_channel
      : eligible.includes("email")
        ? "email"
        : eligible[0];

  return (
    <SettingsCard title="Two-factor authentication" id="twofactor">
      <p className="text-body-sm text-text-muted">
        Add a second step at login. After your password, we&apos;ll send a one-time code to your email or phone.
      </p>

      {/* CONFIRM step (after enable) */}
      {mode === "confirm" ? (
        <div className="mt-4 space-y-3">
          <p aria-live="polite" className="text-body-sm text-text-muted">
            Enter the code we sent to <span className="font-medium text-ink">{sentTo}</span>.
          </p>
          <OtpInput value={code} onChange={setCode} onComplete={() => confirm.mutate()} disabled={confirm.isPending} error={!!error} />
          {error && <p role="alert" className="text-body-sm text-error">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" pending={confirm.isPending} disabled={code.length < 6} onClick={() => confirm.mutate()}>
              {confirm.isPending ? "Turning on…" : "Turn on"}
            </Button>
            <Button type="button" variant="ghost" fullWidth={false} onClick={reset}>Cancel</Button>
          </div>
        </div>
      ) : mode === "disable" ? (
        /* DISABLE step 1 — password (a code step follows if the backend demands one) */
        <div className="mt-4 space-y-3">
          <PasswordField label="Current password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error ?? undefined} />
          <div className="flex gap-2">
            <Button type="button" variant="destructive" pending={disable.isPending} disabled={!password} onClick={() => disable.mutate(false)}>
              {disable.isPending ? "Turning off…" : "Turn off"}
            </Button>
            <Button type="button" variant="ghost" fullWidth={false} onClick={reset}>Cancel</Button>
          </div>
        </div>
      ) : mode === "disable-code" ? (
        /* DISABLE step 2 — fresh code (session wasn't 2FA-verified, FR-MFA-002/018) */
        <div className="mt-4 space-y-3">
          <p aria-live="polite" className="text-body-sm text-text-muted">
            {disableHint ?? "We sent a verification code — enter it to turn off two-factor authentication."}
          </p>
          <OtpInput value={code} onChange={(next) => { setCode(next); setError(null); }} onComplete={() => disable.mutate(true)} disabled={disable.isPending} error={!!error} />
          {error && <p role="alert" className="text-body-sm text-error">{error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="destructive" pending={disable.isPending} disabled={code.length < 6} onClick={() => disable.mutate(true)}>
              {disable.isPending ? "Turning off…" : "Turn off"}
            </Button>
            <Button type="button" variant="ghost" fullWidth={false} onClick={reset}>Cancel</Button>
          </div>
          <button
            type="button"
            onClick={() => disable.mutate(false)}
            disabled={disable.isPending}
            className="text-body-sm font-semibold text-volt-600 underline hover:no-underline disabled:opacity-60"
          >
            Send a new code
          </button>
        </div>
      ) : (
        /* IDLE — status + primary control */
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <p className="text-body font-semibold text-ink">
                {enabled ? `On — codes by ${CHANNEL_LABEL[data.preferred_channel ?? "email"]}` : "Off"}
              </p>
            </div>
            {enabled ? (
              <Button type="button" variant="secondary" fullWidth={false} onClick={() => { setError(null); setMode("disable"); }}>Turn off</Button>
            ) : eligible.length > 0 ? (
              <Button type="button" fullWidth={false} pending={enable.isPending} onClick={() => enable.mutate(channel ?? defaultChannel)}>
                {enable.isPending ? "Sending…" : "Turn on"}
              </Button>
            ) : null}
          </div>

          {/* Channel choice when enabling with >1 eligible — pre-selects the policy default (FR-MFA-036) */}
          {!enabled && eligible.length > 1 && (
            <ChannelRadios value={channel ?? defaultChannel} options={eligible} onChange={setChannel} label="Send codes to" />
          )}

          {/* Preferred channel when enabled with >1 eligible */}
          {enabled && eligible.length > 1 && (
            <ChannelRadios value={data.preferred_channel ?? eligible[0]} options={eligible} onChange={(c) => setPreferred.mutate(c)} label="Preferred channel" />
          )}

          {/* Ineligible hint */}
          {!enabled && eligible.length === 0 && (
            <p className="text-body-sm text-text-muted">Verify a phone or email to use two-factor authentication.</p>
          )}

          {error && <p role="alert" className="text-body-sm text-error">{error}</p>}
        </div>
      )}
    </SettingsCard>
  );
}

function ChannelRadios({ value, options, onChange, label }: { value: MfaChannel; options: MfaChannel[]; onChange: (c: MfaChannel) => void; label: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-body-sm text-text-muted">{label}</legend>
      <div className="flex gap-4">
        {options.map((c) => (
          <label key={c} className="flex cursor-pointer items-center gap-2 text-body-sm text-ink">
            <input type="radio" name={`ch-${label}`} checked={value === c} onChange={() => onChange(c)} className="h-4 w-4 text-volt-600 focus:ring-volt-600" />
            {CHANNEL_LABEL[c] === "email" ? "Email" : "SMS"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
