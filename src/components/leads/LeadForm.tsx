"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  useSubmitLead,
  useUploadLeadAttachment,
  type SubmitLeadBody,
} from "@/lib/api/hooks/leads";
import type { LeadType } from "@/lib/api/schemas/leads";
import { useAuthStore } from "@/lib/stores/auth";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/api/errors";
import { Icon } from "@/components/ui/Icon";
import { TurnstileWidget } from "@/components/leads/TurnstileWidget";

/** A claim-evidence file as it moves through upload (FR-LEAD-004). */
type UploadItem = {
  uid: number;
  file: File;
  status: "uploading" | "done" | "error";
  attachmentId?: string;
};

// Client-side evidence-upload limits (claim only) — match the kit helper copy.
const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024; // 10MB each
const ACCEPT = "image/*,video/*";

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
  const upload = useUploadLeadAttachment();
  const siteKey = env.turnstileSiteKey;

  const [type, setType] = useState<LeadType>(defaultType);
  const [name, setName] = useState(customer?.full_name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  // Claim evidence (claim only): each file uploads to POST /leads/attachments and its
  // returned id flows into the submit body's `attachment_ids` (FR-LEAD-004).
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uidRef = useRef(0);
  // Turnstile token (FR-LEAD-006); resetKey remounts the widget for a fresh challenge.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const isClaim = type === "claim_return";
  const field = "h-11 w-full rounded-sm border border-border-strong px-3 text-body text-ink focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]";

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    setFileError(null);
    const incoming = Array.from(selected);
    const bad = incoming.find((f) => !/^(image|video)\//.test(f.type));
    if (bad) {
      setFileError("Only images or video are allowed.");
      return;
    }
    const tooBig = incoming.find((f) => f.size > MAX_BYTES);
    if (tooBig) {
      setFileError("Each file must be 10MB or less.");
      return;
    }
    if (uploads.length + incoming.length > MAX_FILES) {
      setFileError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }
    // Optimistically show each file as uploading, then upload to POST /leads/attachments
    // and record the returned id (or mark the row errored).
    const items: UploadItem[] = incoming.map((file) => ({
      uid: (uidRef.current += 1),
      file,
      status: "uploading",
    }));
    setUploads((prev) => [...prev, ...items]);
    for (const item of items) {
      upload
        .mutateAsync(item.file)
        .then((res) =>
          setUploads((prev) =>
            prev.map((u) =>
              u.uid === item.uid ? { ...u, status: "done", attachmentId: res.attachment_id } : u,
            ),
          ),
        )
        .catch(() =>
          setUploads((prev) =>
            prev.map((u) => (u.uid === item.uid ? { ...u, status: "error" } : u)),
          ),
        );
    }
  }

  function removeFile(uid: number) {
    setUploads((prev) => prev.filter((u) => u.uid !== uid));
    setFileError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRateLimited(false);
    if (honeypot) return; // bot trap
    if (message.trim().length < 5) {
      setError("Please describe how we can help (at least a few words).");
      return;
    }
    if (isClaim && !orderRef.trim()) {
      setError("Please enter the order reference for your claim.");
      return;
    }
    // Don't submit a half-uploaded state (AC3).
    if (isClaim && uploads.some((u) => u.status === "uploading")) {
      setError("Please wait for your attachments to finish uploading.");
      return;
    }
    if (isClaim && uploads.some((u) => u.status === "error")) {
      setError("Remove the attachment that failed to upload and try again.");
      return;
    }
    const attachmentIds = uploads
      .filter((u) => u.status === "done" && u.attachmentId)
      .map((u) => u.attachmentId as string);
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
      attachment_ids: isClaim && attachmentIds.length > 0 ? attachmentIds : undefined,
      captcha_token: captchaToken ?? undefined,
    };
    try {
      const res = await submit.mutateAsync(body);
      setReference(res.reference);
    } catch (err) {
      // Turnstile tokens are single-use — reset the widget so the user can re-solve.
      setCaptchaToken(null);
      setCaptchaResetKey((k) => k + 1);
      if (err instanceof ApiError && err.status === 400) {
        setError(err.details?.[0]?.message ?? "Please check your details and try again.");
      } else if (err instanceof ApiError && err.status === 429) {
        setRateLimited(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }

  function resetForm() {
    setReference(null);
    setSubject("");
    setMessage("");
    setOrderRef("");
    setUploads([]);
    setFileError(null);
    setError(null);
    setRateLimited(false);
    setCaptchaToken(null);
    setCaptchaResetKey((k) => k + 1);
  }

  if (reference) {
    return <SuccessView reference={reference} onSendAnother={resetForm} />;
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
        <div className="space-y-3 rounded-md border border-border bg-surface-50 p-4">
          <p className="text-body-sm text-text-muted">
            For a claim, add your order reference and any photos/video of the issue.
          </p>
          <input className={field} placeholder="Order reference (e.g. SO-100245)" value={orderRef} onChange={(e) => setOrderRef(e.target.value)} />

          {/* Evidence upload — client-side selection + validation only (BE upload flagged). */}
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-white px-4 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-100 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
            >
              <Icon name="paperclip" size={16} aria-hidden="true" /> Add photos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <p className="mt-1.5 text-label text-text-faint">Images / video · Max 10MB each, up to {MAX_FILES} files</p>

            {uploads.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {uploads.map((u) => (
                  <li
                    key={u.uid}
                    className={
                      "inline-flex items-center gap-1.5 rounded-md border bg-white py-1 pl-2 pr-1 text-label " +
                      (u.status === "error" ? "border-error/50 text-error" : "border-border text-ink")
                    }
                  >
                    <Icon
                      name={u.status === "uploading" ? "loader" : u.status === "error" ? "alert-circle" : "image"}
                      size={14}
                      className={u.status === "uploading" ? "animate-spin text-text-muted" : u.status === "error" ? "text-error" : "text-text-muted"}
                      aria-hidden="true"
                    />
                    <span className="max-w-[140px] truncate">{u.file.name}</span>
                    {u.status === "uploading" && <span className="text-text-faint">Uploading…</span>}
                    {u.status === "error" && <span>Failed</span>}
                    <button
                      type="button"
                      onClick={() => removeFile(u.uid)}
                      aria-label={`Remove ${u.file.name}`}
                      className="grid h-6 w-6 place-items-center rounded text-text-muted transition-colors duration-micro ease-out hover:bg-surface-100 hover:text-ink"
                    >
                      <Icon name="x" size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {fileError && (
              <p role="alert" className="mt-1.5 flex items-center gap-1 text-label text-error">
                <Icon name="alert-circle" size={13} aria-hidden="true" /> {fileError}
              </p>
            )}
          </div>
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

      {rateLimited && (
        <p role="alert" className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-body-sm text-[#B45309]">
          <Icon name="timer" size={16} aria-hidden="true" />
          You&apos;ve sent a few messages — please try again shortly.
        </p>
      )}
      {error && <p role="alert" className="text-body-sm text-error">{error}</p>}

      {/* Spam protection (FR-LEAD-006). Rendered only when a site key is configured; with no key
          the form degrades gracefully and submits without a token (server bypasses in dev). */}
      {siteKey && (
        <TurnstileWidget key={captchaResetKey} siteKey={siteKey} onToken={setCaptchaToken} />
      )}

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

/** Success view (kit SuccessView): check icon + focusable reference pill + two follow-ups. */
function SuccessView({ reference, onSendAnother }: { reference: string; onSendAnother: () => void }) {
  const pillRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    pillRef.current?.focus();
  }, []);
  return (
    <div className="rounded-lg border border-success/30 bg-success/[0.06] p-6 text-center" role="status" aria-live="polite">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success" aria-hidden="true">
        <Icon name="check" size={30} strokeWidth={2.5} />
      </div>
      <h2 className="mt-3 text-h3 font-bold text-ink">Thanks — we&apos;ve got your message</h2>
      <p className="mt-1 text-body-sm text-text-muted">We&apos;ll get back to you soon. Keep your reference handy:</p>
      <span
        ref={pillRef}
        tabIndex={-1}
        aria-label={`Your reference is ${reference}`}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-white px-4 py-1.5 text-body-sm font-bold text-ink focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
      >
        <Icon name="hash" size={14} className="text-text-muted" aria-hidden="true" />
        {reference}
      </span>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link
          href="/account/enquiries"
          className="inline-flex h-11 items-center rounded-md bg-volt px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
        >
          View my enquiries
        </Link>
        <button
          type="button"
          onClick={onSendAnother}
          className="inline-flex h-11 items-center rounded-md border border-border-strong px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-surface-50"
        >
          Send another
        </button>
      </div>
    </div>
  );
}
