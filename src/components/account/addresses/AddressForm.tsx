"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isApiError } from "@/lib/api/errors";
import { toE164, normalizeNationalDigits } from "@/lib/auth/phone";
import { DIVISIONS, districtsOf, areasOf } from "@/lib/geo/bd-geo";
import {
  addressFormSchema,
  type AddressFormValues,
} from "@/lib/validations/address";
import { useCreateAddress, useUpdateAddress } from "@/lib/api/hooks/useAddresses";
import type { AddressDto } from "@/lib/api/schemas/auth";
import { TextField } from "@/components/ui/fields";
import { Button } from "@/components/ui/Button";
import { GeoSelect } from "@/components/account/addresses/GeoSelect";
import { toast } from "@/lib/stores/toast";

/**
 * Add / edit address form (address-book §5). Cascading Division → District →
 * Area; the server resolves `delivery_zone` on save (FR-AUTH-051). The first
 * address auto-defaults server-side.
 */
export function AddressForm({
  existing,
  onDone,
  onCancel,
}: {
  existing?: AddressDto;
  onDone: () => void;
  onCancel: () => void;
}) {
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    mode: "onChange",
    defaultValues: existing
      ? {
          recipient_name: existing.recipient_name,
          recipient_phone_national: existing.recipient_phone.replace(/^\+880/, ""),
          division: existing.division,
          district: existing.district,
          area: existing.area,
          address_line: existing.address_line,
          postal_code: existing.postal_code ?? "",
          is_default: existing.is_default,
        }
      : {
          recipient_name: "",
          recipient_phone_national: "",
          division: "",
          district: "",
          area: "",
          address_line: "",
          postal_code: "",
          is_default: false,
        },
  });

  const division = watch("division");
  const district = watch("district");
  const pending = create.isPending || update.isPending;

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    const body = {
      recipient_name: values.recipient_name.trim(),
      recipient_phone: toE164(values.recipient_phone_national),
      address_line: values.address_line.trim(),
      area: values.area,
      district: values.district,
      division: values.division,
      postal_code: values.postal_code || null,
      is_default: values.is_default,
    };

    const onError = (err: unknown) => {
      if (isApiError(err) && err.status === 400) {
        setFormError(
          /zone|delivery/i.test(err.message)
            ? "We couldn't determine delivery for this area — please check your selection."
            : "Please complete all address fields.",
        );
      } else {
        setFormError("Couldn't save the address. Please try again.");
      }
    };

    if (existing) {
      update.mutate(
        { id: existing.id, body },
        { onSuccess: () => { toast("Address saved."); onDone(); }, onError },
      );
    } else {
      create.mutate(body, {
        onSuccess: () => { toast("Address saved."); onDone(); },
        onError,
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <TextField label="Recipient name" autoComplete="name" error={errors.recipient_name?.message} {...register("recipient_name")} />

      <Controller
        control={control}
        name="recipient_phone_national"
        render={({ field }) => (
          <TextField
            label="Recipient phone"
            prefix="+880"
            inputMode="numeric"
            placeholder="1XXXXXXXXX"
            helper="Courier may call this number."
            value={field.value}
            onChange={(e) => field.onChange(normalizeNationalDigits(e.target.value))}
            error={errors.recipient_phone_national?.message}
          />
        )}
      />

      <GeoSelect
        label="Division"
        placeholder="Select a division"
        value={division}
        options={DIVISIONS}
        error={errors.division?.message}
        onChange={(v) => {
          setValue("division", v, { shouldValidate: true });
          setValue("district", "", { shouldValidate: true });
          setValue("area", "", { shouldValidate: true });
        }}
      />
      <GeoSelect
        label="District"
        placeholder="Select a district"
        value={district}
        options={districtsOf(division)}
        disabled={!division}
        disabledHint="Select a division first."
        error={errors.district?.message}
        onChange={(v) => {
          setValue("district", v, { shouldValidate: true });
          setValue("area", "", { shouldValidate: true });
        }}
      />
      <GeoSelect
        label="Area / Thana"
        placeholder="Select an area"
        value={watch("area")}
        options={areasOf(division, district)}
        disabled={!district}
        disabledHint="Select a district first."
        error={errors.area?.message}
        onChange={(v) => setValue("area", v, { shouldValidate: true })}
      />

      <TextField label="Address line" helper="House / road / landmark" error={errors.address_line?.message} {...register("address_line")} />
      <TextField label="Postal code (optional)" inputMode="numeric" maxLength={4} error={errors.postal_code?.message} {...register("postal_code")} />

      <label className="flex items-center gap-2.5">
        <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500/30" {...register("is_default")} />
        <span className="text-sm text-gray-700">Set as default</span>
      </label>

      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" pending={pending} disabled={!isValid}>
          {pending ? "Saving…" : "Save address"}
        </Button>
      </div>
    </form>
  );
}
