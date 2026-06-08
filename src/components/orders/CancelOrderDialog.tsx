"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";

/**
 * Cancel-order confirmation with a required reason (contract 06 requires a
 * non-empty reason). The reason state lives INSIDE this component so typing in
 * the textarea never re-renders the parent order view — that re-render was what
 * stole focus after each keystroke. The dialog mounts only while open, so the
 * reason resets naturally on each open/close.
 */
export function CancelOrderDialog({
  open,
  isPrepaid,
  pending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  isPrepaid: boolean;
  pending: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const trimmed = reason.trim();
  const invalid = touched && trimmed.length === 0;

  function submit() {
    setTouched(true);
    if (trimmed.length === 0) return;
    onConfirm(trimmed);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Cancel this order?" dismissable={!pending}>
      <div className="space-y-5">
        <p className="text-sm text-gray-700">
          {isPrepaid
            ? "Your payment will be refunded to the original method."
            : "This will cancel your order."}
        </p>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-800">Reason for cancelling</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            maxLength={255}
            rows={3}
            disabled={pending}
            placeholder="e.g. changed my mind, ordered the wrong size…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {invalid && (
            <span className="mt-1 block text-xs text-red-600">Please tell us why you&apos;re cancelling.</span>
          )}
        </label>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Keep order
          </Button>
          <Button variant="danger" pending={pending} onClick={submit}>
            Cancel order
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
