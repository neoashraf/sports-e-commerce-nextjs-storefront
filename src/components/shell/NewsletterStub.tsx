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
      <p role="status" className="text-sm text-gray-300">
        Thanks! We&apos;ll be in touch.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-2">
      <p className="text-xs text-gray-400">Get offers and new arrivals.</p>
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
          className="h-10 min-w-0 flex-1 rounded-md border border-gray-600 bg-gray-800 px-3 text-sm text-white placeholder:text-gray-500 focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          Subscribe
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          Enter a valid email address.
        </p>
      )}
    </form>
  );
}
