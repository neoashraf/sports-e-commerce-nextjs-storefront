"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth";

/**
 * Back-in-stock "Notify me" control (product-detail §5, §7, AC4). Shown in place
 * of Add-to-bag when the resolved variant (or whole product) is out of stock.
 *
 * Notify-me is NOT a CAT FR (INV/NOTIF territory — Open Question in the PR), so
 * the submit is wired to a STUBBED client handler: it validates a phone/email
 * and shows the success copy with no network call. Integration point flagged.
 */
export function NotifyMe({ variantId }: { variantId?: string }) {
  const customer = useAuthStore((s) => s.customer);
  const prefill = customer?.phone ?? customer?.email ?? "";
  const [value, setValue] = useState(prefill);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const validPhone = /^\+?\d[\d\s-]{7,}$/.test(v);
    if (!validEmail && !validPhone) {
      setError(true);
      return;
    }
    setError(false);
    // TODO(INV/NOTIF): replace the stub with the back-in-stock subscribe call.
    void variantId;
    setDone(true);
  }

  if (done) {
    return (
      <p role="status" className="text-sm font-medium text-green-700">
        We&apos;ll let you know when it&apos;s back.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2">
      <div className="flex gap-2">
        <label htmlFor="notify-contact" className="sr-only">
          Phone or email
        </label>
        <input
          id="notify-contact"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(false);
          }}
          placeholder="Phone or email"
          aria-invalid={error}
          className="h-12 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
        />
        <button
          type="submit"
          className="inline-flex h-12 items-center rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          Notify me
        </button>
      </div>
      <p className="text-xs text-gray-500">We&apos;ll text you when it&apos;s back.</p>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          Enter a valid phone or email.
        </p>
      )}
    </form>
  );
}
