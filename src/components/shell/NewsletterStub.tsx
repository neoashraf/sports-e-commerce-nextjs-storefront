"use client";

import { useState } from "react";

/**
 * Newsletter footer field — a NON-WIRED, client-only stub (storefront-shell §7,
 * AC6). No FR backs a newsletter service (Open Question raised in the PR), so on
 * submit it just shows the success copy with no network call.
 */
export function NewsletterStub() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) {
      setError(true);
      return;
    }
    setError(false);
    setDone(true);
  }

  if (done) {
    return (
      <p role="status" className="text-body-sm text-ink-500">
        Thanks! We&apos;ll be in touch.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2">
      <p className="text-body-sm text-ink-500">Get offers and new arrivals.</p>
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Newsletter email
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(false);
          }}
          placeholder="you@example.com"
          aria-invalid={error}
          className="h-11 min-w-0 flex-1 rounded-sm border border-ink-700 bg-ink-700 px-3 text-body-sm text-white placeholder:text-ink-500 focus:border-volt-600 focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-md bg-volt px-4 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
        >
          Subscribe
        </button>
      </div>
      {error && (
        <p role="alert" className="text-body-sm text-error">
          Enter a valid email address.
        </p>
      )}
    </form>
  );
}
