"use client";

import { useState } from "react";
import { me as meApi } from "@/lib/api";
import type { CustomerDto } from "@/lib/api/schemas/auth";
import { SettingsCard } from "./SettingsCard";
import { toast } from "@/lib/stores/toast";

/**
 * Communication preferences (FR-AUTH-060/061/062). Toggles are optimistic with
 * revert on failure; a static note clarifies transactional messages are always
 * sent.
 */
export function CommsGroup({ profile }: { profile: CustomerDto }) {
  return (
    <SettingsCard id="comms" title="Communication">
      <div className="space-y-3">
        <Toggle
          label="Promotional SMS"
          initial={!!profile.promo_sms_opt_in}
          field="promo_sms_opt_in"
        />
        <Toggle
          label="Promotional email"
          initial={!!profile.promo_email_opt_in}
          field="promo_email_opt_in"
        />
        <p className="text-xs text-gray-500">
          Order &amp; security messages are always sent.
        </p>
      </div>
    </SettingsCard>
  );
}

function Toggle({
  label,
  initial,
  field,
}: {
  label: string;
  initial: boolean;
  field: "promo_sms_opt_in" | "promo_email_opt_in";
}) {
  const [on, setOn] = useState(initial);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const next = !on;
    setOn(next); // optimistic
    setSaving(true);
    try {
      await meApi.update({ [field]: next });
    } catch {
      setOn(!next); // revert
      toast("Couldn't update preference.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-800">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={saving}
        onClick={toggle}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
          on ? "bg-brand-600" : "bg-gray-300"
        } disabled:opacity-60`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            on ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
