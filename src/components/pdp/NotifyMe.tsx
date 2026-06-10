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
      <p role="status" className="text-body-sm font-semibold text-success">
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
          className="h-12 min-w-0 flex-1 rounded-sm border border-border-strong px-3 text-body text-ink focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]"
        />
        <button
          type="submit"
          className="inline-flex h-12 items-center rounded-md bg-ink px-5 text-body-sm font-semibold text-white transition-colors duration-micro ease-out hover:bg-ink-700"
        >
          Notify me
        </button>
      </div>
      <p className="text-body-sm text-text-muted">We&apos;ll text you when it&apos;s back.</p>
      {error && (
        <p role="alert" className="text-body-sm text-error">
          Enter a valid phone or email.
        </p>
      )}
    </form>
  );
}
