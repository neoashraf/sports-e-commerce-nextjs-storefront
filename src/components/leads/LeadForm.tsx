"use client";

import { useState } from "react";
import { useSubmitLead, type SubmitLeadBody } from "@/lib/api/hooks/leads";
import type { LeadType } from "@/lib/api/schemas/leads";
import { useAuthStore } from "@/lib/stores/auth";
import { ApiError } from "@/lib/api/errors";

// RW6: the full SRS enquiry-type set. `bulk_order` + `feedback` are plain types
// (no order ref / attachments — only `claim_return` reveals the conditional block).
const TYPES: { value: LeadType; label: string }[] = [
  { value: "general", label: "General question" },
  { value: "product_question", label: "Product question" },
  { value: "order_issue", label: "Order issue" },
  { value: "claim_return", label: "Claim / return" },
  { value: "bulk_order", label: "Bulk / team order" },
  { value: "feedback", label: "Feedback / suggestion" },
];

/**
 * Reusable Get Help / Contact form (get-help-form.md, lead-form-fe). Used on
 * /help, the Contact CMS page, and the PDP "Ask a question" entry (pre-fills
 * product context). Conditional claim fields (order ref + evidence) reveal for
 * `claim_return`. Honeypot + CAPTCHA slot for spam protection. On success shows
 * the reference. Validation errors (400/422/429) mapped from the API.
 */
export function LeadForm({
  defaultType = "general",
  productId,
  source = "get_help",
}: {
  defaultType?: LeadType;
  productId?: string;
  source?: string;
}) {
  const customer = useAuthStore((s) => s.customer);
  const submit = useSubmitLead();

  const [type, setType] = useState<LeadType>(defaultType);
  const [name, setName] = useState(customer?.full_name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const isClaim = type === "claim_return";
  const field = "h-11 w-full rounded-sm border border-border-strong px-3 text-body text-ink focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (honeypot) return; // bot trap
    if (message.trim().length < 5) {
      setError("Please describe how we can help (at least a few words).");
      return;
    }
    if (isClaim && !orderRef.trim()) {
      setError("Please enter the order reference for your claim.");
      return;
    }
    const body: SubmitLeadBody = {
      type,
      subject: subject.trim() || "Help request",
      message: message.trim(),
      submitter_name: name.trim(),
      submitter_phone: phone.trim(),
      submitter_email: email.trim() || undefined,
      order_reference: isClaim ? orderRef.trim() : undefined,
      product_id: productId ?? null,
      source,
    };
    try {
      const res = await submit.mutateAsync(body);
      setReference(res.reference);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError(err.details?.[0]?.message ?? "Please check your details and try again.");
      } else if (err instanceof ApiError && err.status === 429) {
        setError("You've sent a few messages already. Please wait a moment and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  if (reference) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/10 p-6 text-center" aria-live="polite">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/10 text-xl text-success" aria-hidden="true">✓</div>
        <h2 className="mt-3 text-h3 font-bold text-ink">Thanks — we&apos;ve got your message</h2>
        <p className="mt-1 text-body-sm text-text-muted">
          Your reference is <span className="font-semibold text-ink">{reference}</span>. We&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-body-sm font-medium text-ink">What do you need help with?</span>
        <select value={type} onChange={(e) => setType(e.target.value as LeadType)} className={field}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input className={field} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={field} placeholder="Phone (+8801…)" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <input className={field} type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={field} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />

      {isClaim && (
        <div className="space-y-2 rounded-md bg-surface-50 p-3">
          <input className={field} placeholder="Order reference (e.g. SO-100245)" value={orderRef} onChange={(e) => setOrderRef(e.target.value)} />
          <label className="block text-body-sm text-text-muted">
            <span className="mb-1 block font-medium text-ink">Photos (optional)</span>
            <input type="file" accept="image/*" multiple className="text-body-sm" />
            <span className="mt-1 block text-body-sm text-text-faint">Upload wiring lands with the BE integration (flagged).</span>
          </label>
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-body-sm font-medium text-ink">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
          className="w-full rounded-sm border border-border-strong px-3 py-2 text-body text-ink focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]"
          placeholder="Tell us how we can help…"
        />
      </label>

      {/* Honeypot — hidden from users, catches bots. */}
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {error && <p role="alert" className="text-body-sm text-error">{error}</p>}

      <button
        type="submit"
        disabled={submit.isPending}
        className="inline-flex h-11 items-center rounded-md bg-volt px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600 disabled:opacity-50"
      >
        {submit.isPending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
