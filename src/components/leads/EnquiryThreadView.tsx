"use client";

import Link from "next/link";
import { useState } from "react";
import { useEnquiryThread, useReplyEnquiry } from "@/lib/api/hooks/leads";
import { formatDateTime } from "@/lib/format";

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

  return (
    <div>
      <div className="mb-4">
        <Link href="/account/enquiries" className="text-body-sm font-semibold text-volt-600 hover:underline">← My enquiries</Link>
        <h1 className="mt-1 text-h1 font-bold tracking-snug text-ink">{data.subject ?? data.reference}</h1>
        <p className="text-body-sm text-text-muted">
          {data.reference} · {String(data.status).replace(/_/g, " ")}
          {data.order_reference ? ` · Order ${data.order_reference}` : ""}
        </p>
      </div>

      <ul className="space-y-3">
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
        <button type="submit" disabled={reply.isPending || !body.trim()} className="inline-flex h-10 items-center rounded-md bg-volt px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600 disabled:opacity-50">
          {reply.isPending ? "Sending…" : "Send reply"}
        </button>
      </form>
    </div>
  );
}
