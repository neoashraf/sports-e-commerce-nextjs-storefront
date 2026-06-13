"use client";

import type { AddressDto } from "@/lib/api/schemas/auth";
import { Icon } from "@/components/ui/Icon";

/**
 * Address card (address-book §5). Shows the address, a Default badge, and a
 * derived zone chip; long Bangla lines wrap (never clip). Actions are labelled
 * buttons ≥44px. RW7: the default card gets the kit's inset dark border/glow
 * (`data-default` → border-ink + inset ring) and a volt-star Default chip.
 */

const ZONE_LABEL: Record<string, string> = {
  inside_dhaka: "Inside Dhaka",
  near_dhaka: "Near Dhaka",
  outside_dhaka: "Outside Dhaka",
};

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  busy,
}: {
  address: AddressDto;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  busy?: boolean;
}) {
  return (
    <div
      data-default={address.is_default ? "true" : "false"}
      className={`relative rounded-lg border bg-white p-4 ${
        address.is_default
          ? "border-ink shadow-[inset_0_0_0_1px_var(--ink-900)]"
          : "border-border"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {address.is_default && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-label font-medium text-white">
            <Icon name="star" size={12} color="var(--volt)" fill="var(--volt)" />
            Default
          </span>
        )}
        {address.delivery_zone && (
          <span className="rounded-full bg-surface-100 px-2 py-0.5 text-label text-text-muted">
            {ZONE_LABEL[address.delivery_zone] ?? address.delivery_zone}
          </span>
        )}
      </div>

      <p className="break-words font-medium text-ink">{address.recipient_name}</p>
      <p className="break-words text-body-sm text-text-muted">{address.recipient_phone}</p>
      <p className="mt-1 break-words text-body-sm text-ink">
        {address.address_line}, {address.area}, {address.district}, {address.division}
        {address.postal_code ? ` — ${address.postal_code}` : ""}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
        <CardAction onClick={onEdit} disabled={busy}>Edit</CardAction>
        <CardAction onClick={onDelete} disabled={busy} tone="danger">Delete</CardAction>
        {!address.is_default && (
          <CardAction onClick={onSetDefault} disabled={busy}>Set as default</CardAction>
        )}
      </div>
    </div>
  );
}

function CardAction({
  children,
  onClick,
  disabled,
  tone = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[44px] rounded-md border px-3 text-body-sm font-medium transition-colors duration-micro ease-out disabled:opacity-50 ${
        tone === "danger"
          ? "border-error/30 text-error hover:bg-error/10"
          : "border-border-strong text-ink hover:bg-surface-50"
      }`}
    >
      {children}
    </button>
  );
}
