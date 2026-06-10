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
import { useAuthUi } from "@/lib/stores/auth-ui";
import { SettingsCard } from "./SettingsCard";
import { PasswordField } from "@/components/ui/fields";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";

/**
 * Password: change (current + new) for full accounts, or "Set a password" for
 * lightweight accounts (routes to the claim flow, FR-AUTH-032/034). A password
 * change revokes other sessions (FR-AUTH-035) — copy warns about re-login.
 */

const schema = z.object({
  current_password: z.string().min(1, "Enter your current password."),
  new_password: passwordSchema,
});
type Values = z.infer<typeof schema>;

export function PasswordGroup({ profile }: { profile: CustomerDto }) {
  const openAuth = useAuthUi((s) => s.openAuth);
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

  // Lightweight / phone-only account → set a first password via claim.
  if (profile.is_lightweight) {
    return (
      <SettingsCard id="password" title="Password">
        <p className="text-body-sm text-text-muted">Set a password to log in with email later.</p>
        <Button variant="secondary" fullWidth={false} className="mt-3" onClick={() => openAuth({ view: "claim" })}>
          Set a password
        </Button>
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
