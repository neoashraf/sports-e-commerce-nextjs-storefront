"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { auth } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import { useAuthUi } from "@/lib/stores/auth-ui";
import { TextField } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { PhoneStep } from "@/components/auth/PhoneStep";
import { OtpStep } from "@/components/auth/OtpStep";

/**
 * Password-reset request (password-reset brief, screen A). Email mode →
 * generic success (anti-enumeration). Phone mode → OTP flow that hands off to
 * the routed Set-a-new-password page (screen B) via a verified challenge.
 */

const emailSchema = z.object({
  email: z.string().min(1, "Enter a valid email address.").email("Enter a valid email address."),
});
type EmailValues = z.infer<typeof emailSchema>;

export function ResetRequest() {
  const { setView, prefillEmail } = useAuthUi();
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [sentGeneric, setSentGeneric] = useState(false);

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Reset method" className="flex rounded-lg border border-border p-1">
        {(["email", "phone"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={method === m}
            onClick={() => setMethod(m)}
            className={`min-h-[40px] flex-1 rounded-md text-body-sm font-medium transition-colors duration-micro ease-out ${
              method === m ? "bg-volt text-ink hover:bg-volt-600" : "text-text-muted hover:bg-surface-50"
            }`}
          >
            {m === "email" ? "Email" : "Phone"}
          </button>
        ))}
      </div>

      {method === "email" ? (
        sentGeneric ? (
          <p role="status" aria-live="polite" className="rounded-md bg-success/10 px-3 py-3 text-body-sm text-success">
            If that email is registered, we&apos;ve sent a reset link. Check your inbox (and spam).
          </p>
        ) : (
          <EmailResetForm prefillEmail={prefillEmail} onSent={() => setSentGeneric(true)} />
        )
      ) : (
        <PhoneResetFlow />
      )}

      <button
        type="button"
        onClick={() => setView("email-login", prefillEmail)}
        className="block w-full text-center text-body-sm font-medium text-text-muted transition-colors duration-micro ease-out hover:text-ink"
      >
        ‹ Back to login
      </button>
    </div>
  );
}

function EmailResetForm({ prefillEmail, onSent }: { prefillEmail?: string; onSent: () => void }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    mode: "onChange",
    defaultValues: { email: prefillEmail ?? "" },
  });

  const forgot = useMutation({
    mutationFn: (values: EmailValues) => auth.forgotPassword(values.email.trim().toLowerCase()),
    onSuccess: onSent,
    onError: (err) =>
      setSubmitError(
        isApiError(err) && err.status === 0
          ? "You're offline. Check your connection and try again."
          : "Something went wrong. Please try again.",
      ),
  });

  return (
    <form onSubmit={handleSubmit((v) => { setSubmitError(null); forgot.mutate(v); })} className="space-y-4" noValidate>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        helper="We'll email a reset link (valid 30 min)."
        error={errors.email?.message}
        {...register("email")}
      />
      {submitError && (
        <p role="alert" className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">{submitError}</p>
      )}
      <Button type="submit" pending={forgot.isPending} disabled={!isValid}>
        {forgot.isPending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

/**
 * Phone-mode reset (FR-AUTH-034): OTP to the account phone, then route to the
 * Set-password page carrying the verified challenge so it can set a password.
 */
function PhoneResetFlow() {
  const [sent, setSent] = useState<{ phone: string; challengeId: string; resendAfter: number } | null>(null);

  if (!sent) {
    return <PhoneStep purpose="password_reset" onSent={setSent} />;
  }
  return (
    <OtpStep<{ challenge_id: string; code: string }>
      phone={sent.phone}
      challengeId={sent.challengeId}
      resendAfter={sent.resendAfter}
      purpose="password_reset"
      collectName={false}
      // For phone reset we only need the code verified; the Set-password page
      // completes via the reset endpoint. We pass the verified code through.
      verify={async ({ challengeId, code }) => ({ challenge_id: challengeId, code })}
      onVerified={({ challenge_id, code }) => {
        window.location.assign(
          `/reset-password?challenge=${encodeURIComponent(challenge_id)}&code=${encodeURIComponent(code)}`,
        );
      }}
      onEditNumber={() => setSent(null)}
    />
  );
}
