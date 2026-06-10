"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { me as meApi } from "@/lib/api";
import { patchCustomer } from "@/lib/auth/session";
import { meKeys } from "@/lib/api/hooks/useMe";
import type { CustomerDto } from "@/lib/api/schemas/auth";
import { SettingsCard } from "./SettingsCard";
import { TextField } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";

/** Profile: name / gender / DOB (FR-AUTH-040). DOB requires age ≥ 13. */

const GENDERS = ["male", "female", "other", "undisclosed"] as const;

const schema = z.object({
  full_name: z.string().trim().min(1, "Please enter your name."),
  gender: z.enum(GENDERS).optional(),
  date_of_birth: z
    .string()
    .optional()
    .refine(
      (v) => !v || isAtLeast13(v),
      "You must be at least 13.",
    ),
});
type Values = z.infer<typeof schema>;

function isAtLeast13(iso: string): boolean {
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return false;
  const cutoff = new Date(dob);
  cutoff.setFullYear(cutoff.getFullYear() + 13);
  // Compare against "now" via Date constructor on a fixed call is disallowed in
  // workflow scripts only; in app runtime new Date() is fine.
  return cutoff <= new Date();
}

export function ProfileGroup({ profile }: { profile: CustomerDto }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      full_name: profile.full_name ?? "",
      gender: profile.gender ?? undefined,
      date_of_birth: profile.date_of_birth ?? "",
    },
  });

  const save = useMutation({
    mutationFn: (v: Values) =>
      meApi.update({
        full_name: v.full_name.trim(),
        gender: v.gender,
        date_of_birth: v.date_of_birth || null,
      }),
    onSuccess: (_res, v) => {
      patchCustomer({ full_name: v.full_name.trim() });
      qc.invalidateQueries({ queryKey: meKeys.me });
      toast("Saved.");
      setEditing(false);
    },
    onError: () => toast("Couldn't save. Please try again.", "error"),
  });

  if (!editing) {
    return (
      <SettingsCard id="profile" title="Profile">
        <dl className="space-y-2 text-body-sm">
          <Row label="Name" value={profile.full_name || "—"} />
          <Row label="Gender" value={profile.gender || "Add"} />
          <Row label="Date of birth" value={profile.date_of_birth || "Add"} />
        </dl>
        <Button variant="secondary" fullWidth={false} className="mt-4" onClick={() => { reset(); setEditing(true); }}>
          Edit
        </Button>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard id="profile" title="Profile">
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
        <TextField label="Full name" autoComplete="name" maxLength={120} error={errors.full_name?.message} {...register("full_name")} />
        <div className="space-y-1.5">
          <label htmlFor="gender" className="block text-body-sm font-medium text-ink">Gender (optional)</label>
          <select id="gender" className="min-h-[44px] w-full rounded-sm border border-border-strong bg-white px-3 text-body text-ink transition-colors duration-micro ease-out focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]" {...register("gender")}>
            <option value="">Prefer not to say</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <TextField label="Date of birth (optional)" type="date" error={errors.date_of_birth?.message} {...register("date_of_birth")} />
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
          <Button type="submit" pending={save.isPending} disabled={!isValid || !isDirty}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </SettingsCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd className="break-words text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
