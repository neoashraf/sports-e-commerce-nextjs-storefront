"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { me as meApi } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import { passwordSchema } from "@/lib/auth/password";
import type { CustomerDto } from "@/lib/api/schemas/auth";
import { SettingsCard } from "./SettingsCard";
import { SetPasswordFlow } from "./SetPasswordFlow";
import { PasswordField } from "@/components/ui/fields";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";

/**
 * Password: change (current + new) for accounts with a password, or the
 * "finish your account" set-password card for ANY passwordless account
 * (FR-AUTH-032/036 — replaces the retired lightweight claim flow). A password
 * change/set revokes other sessions (FR-AUTH-038) — copy warns about re-login.
 */

const schema = z.object({
  current_password: z.string().min(1, "Enter your current password."),
  new_password: passwordSchema,
});
type Values = z.infer<typeof schema>;

export function PasswordGroup({ profile }: { profile: CustomerDto }) {
  const [editing, setEditing] = useState(false);
  const checklistId = useId();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isValid },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { current_password: "", new_password: "" },
  });

  const change = useMutation({
    mutationFn: (v: Values) => meApi.changePassword(v.current_password, v.new_password),
    onSuccess: () => {
      toast("Password changed.");
      reset();
      setEditing(false);
    },
    onError: (err) => {
      if (isApiError(err) && err.status === 401) {
        setError("current_password", { type: "server", message: "Current password is incorrect." });
      } else {
        toast("Couldn't change password. Please try again.", "error");
      }
    },
  });

  // Passwordless (phone-OTP / Google-born) account → finish it with a first password
  // (FR-AUTH-036; the OTP step is skipped inside the freshness window, FR-AUTH-037).
  if (profile.has_password === false) {
    return (
      <SettingsCard id="password" title="Password">
        <p className="text-body-sm text-text-muted">
          Finish your account — set a password to also log in with email later.
        </p>
        <div className="mt-3">
          <SetPasswordFlow />
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard id="password" title="Password">
      {!editing ? (
        <Button variant="secondary" fullWidth={false} onClick={() => setEditing(true)}>
          Change password
        </Button>
      ) : (
        <form onSubmit={handleSubmit((v) => change.mutate(v))} className="space-y-4" noValidate>
          <PasswordField label="Current password" autoComplete="current-password" error={errors.current_password?.message} {...register("current_password")} />
          <div className="space-y-2">
            <PasswordField label="New password" autoComplete="new-password" describedBy={checklistId} error={errors.new_password?.message} {...register("new_password")} />
            <PasswordChecklist id={checklistId} value={watch("new_password")} />
          </div>
          <p className="text-label text-text-muted">You may need to log in again on other devices.</p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => { reset(); setEditing(false); }}>Cancel</Button>
            <Button type="submit" pending={change.isPending} disabled={!isValid}>
              {change.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      )}
    </SettingsCard>
  );
}
