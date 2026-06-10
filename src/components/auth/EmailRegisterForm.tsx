"use client";

import { useId, useState } from "react";
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
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { LegalLine } from "@/components/auth/PhoneStep";
import {
  emailRegisterSchema,
  type EmailRegisterValues,
} from "@/lib/validations/auth-email";

/**
 * Email registration (email-register brief): name + email + password (live
 * policy checklist) + promo consent. `409` → inline "already registered" with a
 * Log-in link; success → session + verify-email banner shown on account home.
 */
export function EmailRegisterForm() {
  const { setView, prefillEmail, closeAuth } = useAuthUi();
  const [emailExists, setEmailExists] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const checklistId = useId();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setFocus,
    formState: { errors, isValid },
  } = useForm<EmailRegisterValues>({
    resolver: zodResolver(emailRegisterSchema),
    mode: "onChange",
    defaultValues: {
      full_name: "",
      email: prefillEmail ?? "",
      password: "",
      promo_email_opt_in: false,
    },
  });

  const password = watch("password");

  const registerMutation = useMutation({
    mutationFn: (values: EmailRegisterValues) =>
      auth.register({
        full_name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        promo_email_opt_in: values.promo_email_opt_in,
      }),
    onSuccess: (res) => {
      commitSession(res.customer, res.tokens);
      toast(`Welcome, ${res.customer.full_name ?? "there"}!`);
      closeAuth();
      consumePendingAction();
    },
    onError: (err) => {
      if (isApiError(err)) {
        if (err.status === 409) {
          setEmailExists(true);
          setError("email", { type: "server", message: "This email is already registered." });
          setFocus("email");
          return;
        }
        if (err.status === 0) {
          setSubmitError("You're offline. Check your connection and try again.");
          return;
        }
      }
      setSubmitError("Couldn't create your account. Please try again.");
    },
  });

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null);
    setEmailExists(false);
    registerMutation.mutate(values);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <TextField
        label="Full name"
        autoComplete="name"
        maxLength={120}
        helper="Shown on your orders."
        error={errors.full_name?.message}
        {...register("full_name")}
      />

      <div>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          helper="We'll send a verification link."
          error={errors.email?.message}
          {...register("email")}
        />
        {emailExists && (
          <button
            type="button"
            onClick={() => setView("email-login", watch("email"))}
            className="mt-1 text-body-sm font-medium text-volt-600 hover:underline"
          >
            Log in instead
          </button>
        )}
      </div>

      <div className="space-y-2">
        <PasswordField
          label="Password"
          autoComplete="new-password"
          describedBy={checklistId}
          error={errors.password?.message}
          {...register("password")}
        />
        <PasswordChecklist id={checklistId} value={password} />
      </div>

      <label className="flex items-start gap-2.5">
        <input
          type="checkbox"
          className="mt-0.5 h-5 w-5 rounded-sm border-border-strong text-volt-600 accent-volt-600"
          {...register("promo_email_opt_in")}
        />
        <span className="text-body-sm text-text-muted">
          Send me offers and updates by email/SMS.
          <span className="block text-body-sm text-text-faint">You can change this anytime in Settings.</span>
        </span>
      </label>

      {submitError && (
        <p role="alert" aria-live="assertive" className="rounded-md bg-error/10 px-3 py-2 text-body-sm text-error">
          {submitError}
        </p>
      )}

      <Button type="submit" pending={registerMutation.isPending} disabled={!isValid}>
        {registerMutation.isPending ? "Creating account…" : "Create account"}
      </Button>

      <div className="flex items-center justify-between text-body-sm">
        <button type="button" onClick={() => setView("phone")} className="font-medium text-text-muted transition-colors duration-micro ease-out hover:text-ink">
          Use phone instead
        </button>
        <button type="button" onClick={() => setView("email-login", watch("email"))} className="font-medium text-volt-600 hover:underline">
          Already have an account? Log in
        </button>
      </div>

      <LegalLine />
    </form>
  );
}
