"use client";

import type { AddressDto } from "@/lib/api/schemas/auth";

/**
 * Address card (address-book §5). Shows the address, a Default badge, and a
 * derived zone chip; long Bangla lines wrap (never clip). Actions are labelled
 * buttons ≥44px.
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
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {address.is_default && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            Default
          </span>
        )}
        {address.delivery_zone && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {ZONE_LABEL[address.delivery_zone] ?? address.delivery_zone}
          </span>
        )}
      </div>

      <p className="font-medium text-gray-900">{address.recipient_name}</p>
      <p className="text-sm text-gray-600">{address.recipient_phone}</p>
      <p className="mt-1 break-words text-sm text-gray-700">
        {address.address_line}, {address.area}, {address.district}, {address.division}
        {address.postal_code ? ` — ${address.postal_code}` : ""}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
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
      className={`min-h-[44px] rounded-lg border px-3 text-sm font-medium disabled:opacity-50 ${
        tone === "danger"
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}
