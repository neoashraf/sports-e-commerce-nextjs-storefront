"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { me } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import { toast } from "@/lib/stores/toast";
import type { MfaChannel } from "@/lib/api/schemas/auth";
import { SettingsCard } from "@/components/account/settings/SettingsCard";
import { OtpInput } from "@/components/auth/OtpInput";
import { PasswordField } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";

const CHANNEL_LABEL: Record<MfaChannel, string> = { sms: "SMS", email: "email" };

/**
 * Two-factor authentication settings group (mfa-account-settings §5). Shows the current state and
 * lets the customer enable (pick channel → confirm a code), disable (current password), and change
 * the preferred channel (FR-MFA-001/002/003/035). No-eligible-channel / no-password accounts are
 * guided, not dead-ended (BR-MFA-3, §13).
 */
export function TwoFactorGroup() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["me-mfa"], queryFn: () => me.mfa.get(), staleTime: 30_000 });

  const [mode, setMode] = useState<"idle" | "confirm" | "disable">("idle");
  const [channel, setChannel] = useState<MfaChannel | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string>("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["me-mfa"] });
  const reset = () => { setMode("idle"); setCode(""); setPassword(""); setError(null); setChallengeId(null); };

  const enable = useMutation({
    mutationFn: (ch: MfaChannel | undefined) => me.mfa.enable(ch),
    onSuccess: (res) => { setChallengeId(res.verification.challenge_id); setSentTo(res.verification.sent_to); setChannel(res.verification.channel); setCode(""); setError(null); setMode("confirm"); },
    onError: (err) => {
      if (isApiError(err) && err.code === "MFA_PASSWORD_REQUIRED") setError("Set a password to use two-factor authentication.");
      else if (isApiError(err) && err.code === "NO_ELIGIBLE_CHANNEL") setError("Verify a phone or email to use two-factor authentication.");
      else setError("Couldn't start setup. Try again.");
    },
  });

  const confirm = useMutation({
    mutationFn: () => me.mfa.confirmEnable(challengeId as string, code),
    onSuccess: () => { toast("Two-factor authentication turned on."); reset(); refresh(); },
    onError: (err) => { setCode(""); setError(isApiError(err) && /expire/i.test(err.message) ? "This code has expired." : "Incorrect code. Please try again."); },
  });

  const disable = useMutation({
    mutationFn: () => me.mfa.disable(password),
    onSuccess: () => { toast("Two-factor authentication turned off."); reset(); refresh(); },
    onError: (err) => { setError(isApiError(err) && err.status === 401 ? "Current password is incorrect." : "Couldn't turn off. Try again."); },
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
        /* DISABLE step */
        <div className="mt-4 space-y-3">
          <PasswordField label="Current password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error ?? undefined} />
          <div className="flex gap-2">
            <Button type="button" variant="destructive" pending={disable.isPending} disabled={!password} onClick={() => disable.mutate()}>
              {disable.isPending ? "Turning off…" : "Turn off"}
            </Button>
            <Button type="button" variant="ghost" fullWidth={false} onClick={reset}>Cancel</Button>
          </div>
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
              <Button type="button" fullWidth={false} pending={enable.isPending} onClick={() => enable.mutate(channel ?? (eligible.includes("email") ? "email" : eligible[0]))}>
                {enable.isPending ? "Sending…" : "Turn on"}
              </Button>
            ) : null}
          </div>

          {/* Channel choice when enabling with >1 eligible */}
          {!enabled && eligible.length > 1 && (
            <ChannelRadios value={channel ?? (eligible.includes("email") ? "email" : eligible[0])} options={eligible} onChange={setChannel} label="Send codes to" />
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
