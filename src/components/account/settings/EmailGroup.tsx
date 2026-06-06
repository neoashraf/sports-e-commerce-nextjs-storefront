"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, me as meApi } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import { patchCustomer } from "@/lib/auth/session";
import { meKeys } from "@/lib/api/hooks/useMe";
import type { CustomerDto } from "@/lib/api/schemas/auth";
import { SettingsCard, VerifyBadge } from "./SettingsCard";
import { TextField } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";

/** Email: value + verify badge + change (FR-AUTH-041/043). */

const schema = z.object({
  email: z.string().min(1, "Enter a valid email.").email("Enter a valid email."),
});
type Values = z.infer<typeof schema>;

export function EmailGroup({ profile }: { profile: CustomerDto }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: profile.email ?? "" },
  });

  const change = useMutation({
    mutationFn: (v: Values) => meApi.update({ email: v.email.trim().toLowerCase() }),
    onSuccess: (_res, v) => {
      patchCustomer({ email: v.email.trim().toLowerCase(), email_verified: false });
      qc.invalidateQueries({ queryKey: meKeys.me });
      toast("Verification email sent.");
      setEditing(false);
    },
    onError: (err) => {
      if (isApiError(err) && err.status === 409) {
        setError("email", { type: "server", message: "This email is already in use." });
      } else {
        toast("Couldn't save. Please try again.", "error");
      }
    },
  });

  const resend = useMutation({
    mutationFn: () => auth.resendVerifyEmail(),
    onSuccess: () => toast("Verification email sent."),
    onError: () => toast("Couldn't resend right now.", "error"),
  });

  return (
    <SettingsCard id="email" title="Email">
      {!editing ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="break-all text-sm text-gray-900">{profile.email || "No email added"}</p>
            {profile.email && <VerifyBadge verified={!!profile.email_verified} />}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" fullWidth={false} onClick={() => setEditing(true)}>
              {profile.email ? "Change" : "Add email"}
            </Button>
            {profile.email && !profile.email_verified && (
              <Button variant="ghost" fullWidth={false} pending={resend.isPending} onClick={() => resend.mutate()}>
                Resend verification
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit((v) => change.mutate(v))} className="space-y-4" noValidate>
          <TextField label="Email" type="email" autoComplete="email" helper="We'll send a verification link." error={errors.email?.message} {...register("email")} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button type="submit" pending={change.isPending} disabled={!isValid}>
              {change.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      )}
    </SettingsCard>
  );
}
