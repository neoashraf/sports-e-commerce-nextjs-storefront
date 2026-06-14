"use client";

import Link from "next/link";
import { useState } from "react";
import { useEnquiryThread, useReplyEnquiry } from "@/lib/api/hooks/leads";
import { formatDateTime } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { EnquiryStatusBadge } from "./EnquiryStatusBadge";

const CLOSED = new Set(["closed", "resolved"]);

/**
 * Enquiry thread + reply (my-enquiries.md, lead-form-fe AC3). Shows the message
 * thread (inbound/outbound) and a reply box; replying reopens the enquiry.
 */
export function EnquiryThreadView({ reference }: { reference: string }) {
  const { data, isLoading, isError } = useEnquiryThread(reference);
  const reply = useReplyEnquiry(reference);
  const [body, setBody] = useState("");

  if (isLoading) return <div className="h-64 animate-pulse rounded-lg bg-surface-100" />;
  if (isError || !data) {
    return (
      <div className="py-12 text-center">
        <p className="text-body-sm text-text-muted">Couldn&apos;t load this enquiry.</p>
        <Link href="/account/enquiries" className="mt-2 inline-block text-body-sm font-semibold text-volt-600 hover:underline">Back to my enquiries</Link>
      </div>
    );
  }

  async function onReply(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await reply.mutateAsync(body.trim());
    setBody("");
  }

  const isClosed = CLOSED.has(String(data.status));

  return (
    <div>
      <div className="mb-4">
        <Link href="/account/enquiries" className="inline-flex items-center gap-1 text-body-sm font-semibold text-volt-600 hover:underline">
          <Icon name="arrow-left" size={15} aria-hidden="true" /> My enquiries
        </Link>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-h1 font-bold tracking-snug text-ink">{data.subject ?? data.reference}</h1>
          <EnquiryStatusBadge status={String(data.status)} />
        </div>
        <p className="text-body-sm text-text-muted">
          {data.reference}
          {data.order_reference ? ` · Order ${data.order_reference}` : ""}
        </p>
      </div>

      <ul className="space-y-3" aria-live="polite">
        {data.messages.map((m, i) => {
          const isYou = m.direction === "inbound";
          return (
            <li key={i} className={"flex flex-col " + (isYou ? "items-end" : "items-start")}>
              <span className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                {isYou ? "You" : "Support"}
              </span>
              <div className={"max-w-[80%] rounded-md px-4 py-2 text-body-sm " + (isYou ? "bg-ink text-white" : "bg-surface-100 text-ink")}>
                <p className="whitespace-pre-line break-words">{m.body}</p>
                <p className={"mt-1 text-[11px] " + (isYou ? "text-white/70" : "text-text-muted")}>
                  {formatDateTime(m.created_at)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {isClosed ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-md border border-border bg-surface-50 p-5 text-center">
          <Icon name="lock" size={20} className="text-text-muted" aria-hidden="true" />
          <p className="text-body-sm font-semibold text-ink">This enquiry is closed.</p>
          <Link href="/help" className="text-body-sm font-semibold text-volt-600 hover:underline">Start a new enquiry</Link>
        </div>
      ) : (
        <form onSubmit={onReply} className="mt-6 space-y-2">
          <label htmlFor="reply" className="sr-only">Your reply</label>
          <textarea
            id="reply"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Write a reply…"
            className="w-full rounded-sm border border-border-strong px-3 py-2 text-body text-ink focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(166,212,0,0.35)]"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-label text-text-faint">Replying reopens this enquiry.</p>
            <button type="submit" disabled={reply.isPending || !body.trim()} className="inline-flex h-10 items-center gap-1.5 rounded-md bg-volt px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600 disabled:opacity-50">
              <Icon name="send" size={15} aria-hidden="true" />
              {reply.isPending ? "Sending…" : "Send reply"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
