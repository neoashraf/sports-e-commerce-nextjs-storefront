"use client";

import { useId, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { auth } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import { passwordSchema } from "@/lib/auth/password";
import { endSession } from "@/lib/auth/session";
import { toast } from "@/lib/stores/toast";
import { useAuthUi } from "@/lib/stores/auth-ui";
import { PasswordField } from "@/components/ui/fields";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { Button } from "@/components/ui/Button";

/**
 * Screen B form. Handles both entry modes: email-link (`?token=`) and the
 * phone-reset handoff (`?challenge=&code=`). On success all sessions are
 * revoked (FR-AUTH-035) → redirect to login with a one-time note.
 */

const schema = z
  .object({
    new_password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.new_password === v.confirm, {
    path: ["confirm"],
    message: "Passwords don't match.",
  });
type Values = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const openAuth = useAuthUi((s) => s.openAuth);
  const token = params.get("token");
  const phoneMode = !token; // arrived from phone-reset handoff
  const [expired, setExpired] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const checklistId = useId();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { new_password: "", confirm: "" },
  });

  const reset = useMutation({
    mutationFn: (values: Values) => {
      if (token) return auth.resetPassword(token, values.new_password);
      // Phone mode: the verified OTP challenge sets the (first) password.
      // The contract's reset endpoint takes a token; phone-mode handoff is an
      // assumption to confirm with the backend dev (see PR notes).
      return auth.resetPassword(
        `phone:${params.get("challenge")}:${params.get("code")}`,
        values.new_password,
      );
    },
    onSuccess: async () => {
      await endSession(); // all sessions revoked server-side; clear locally too
      router.replace("/?reset=success");
      openAuth({ view: "email-login" });
      toast("Password updated — please log in.");
    },
    onError: (err) => {
      if (isApiError(err) && err.status === 410) {
        setExpired(true);
        return;
      }
      setSubmitError("Something went wrong. Please try again.");
    },
  });

  if (expired) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Link expired</h1>
        <p className="text-sm text-gray-600">
          This reset link has expired or was already used.
        </p>
        <Button onClick={() => openAuth({ view: "reset-request" })}>
          Request a new link
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((v) => { setSubmitError(null); reset.mutate(v); })} className="space-y-4" noValidate>
      <div>
        <h1 className="text-lg font-semibold text-gray-900">
          {phoneMode ? "Set a password" : "Set a new password"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          You&apos;ll be signed out everywhere and asked to log in again.
        </p>
      </div>

      <div className="space-y-2">
        <PasswordField
          label="New password"
          autoComplete="new-password"
          describedBy={checklistId}
          error={errors.new_password?.message}
          {...register("new_password")}
        />
        <PasswordChecklist id={checklistId} value={watch("new_password")} />
      </div>

      <PasswordField
        label="Confirm password"
        autoComplete="new-password"
        error={errors.confirm?.message}
        {...register("confirm")}
      />

      {submitError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
      )}

      <Button type="submit" pending={reset.isPending} disabled={!isValid}>
        {reset.isPending ? "Updating…" : "Update password"}
      </Button>

      <a href="/" className="block text-center text-sm font-medium text-gray-600 hover:text-gray-900">
        Back to login
      </a>
    </form>
  );
}
