"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { auth } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import { commitSession } from "@/lib/auth/session";
import { consumePendingAction } from "@/lib/auth/pending-action";
import { toast } from "@/lib/stores/toast";
import { useAuthUi } from "@/lib/stores/auth-ui";
import { TextField, PasswordField } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { LegalLine } from "@/components/auth/PhoneStep";
import { useCountdown } from "@/lib/hooks/useCountdown";
import {
  emailLoginSchema,
  type EmailLoginValues,
} from "@/lib/validations/auth-email";

/**
 * Email + password login (email-login brief). Server-confirmed; never reveals
 * which field was wrong (anti-enumeration); `423` swaps the inline error for a
 * countdown lockout banner (FR-AUTH-012).
 */
export function EmailLoginForm() {
  const { setView, prefillEmail, closeAuth } = useAuthUi();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const lockout = useCountdown();

  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isValid },
  } = useForm<EmailLoginValues>({
    resolver: zodResolver(emailLoginSchema),
    mode: "onChange",
    defaultValues: { email: prefillEmail ?? "", password: "" },
  });

  const login = useMutation({
    mutationFn: (values: EmailLoginValues) =>
      auth.login({ email: values.email.trim().toLowerCase(), password: values.password }),
    onSuccess: (res) => {
      commitSession(res.customer, res.tokens);
      toast("Logged in");
      closeAuth();
      consumePendingAction();
    },
    onError: (err) => {
      resetField("password");
      if (isApiError(err)) {
        if (err.status === 423) {
          lockout.start(err.retryAfter ?? 900);
          setSubmitError(null);
          return;
        }
        if (err.status === 401) {
          setSubmitError("Email or password is incorrect.");
          return;
        }
        if (err.status === 0) {
          setSubmitError("You're offline. Check your connection and try again.");
          return;
        }
      }
      setSubmitError("Something went wrong. Please try again.");
    },
  });

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null);
    login.mutate(values);
  });

  const locked = lockout.isRunning;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <PasswordField
        label="Password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <button
        type="button"
        onClick={() => setView("reset-request")}
        className="block w-full text-right text-body-sm font-medium text-volt-600 hover:underline"
      >
        Forgot password?
      </button>

      {locked && (
        <p role="alert" aria-live="assertive" className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
          Too many attempts. Try again in {lockout.mmss}, or reset your password.
        </p>
      )}
      {submitError && !locked && (
        <p role="alert" aria-live="assertive" className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
          {submitError}
        </p>
      )}

      <Button type="submit" pending={login.isPending} disabled={!isValid || locked}>
        {login.isPending ? "Logging in…" : "Log in"}
      </Button>

      <div className="flex items-center justify-between text-body-sm">
        <button type="button" onClick={() => setView("phone")} className="font-medium text-text-muted transition-colors duration-micro ease-out hover:text-ink">
          Use phone instead
        </button>
        <button type="button" onClick={() => setView("email-register")} className="font-medium text-volt-600 hover:underline">
          Create account
        </button>
      </div>

      <LegalLine />
    </form>
  );
}
