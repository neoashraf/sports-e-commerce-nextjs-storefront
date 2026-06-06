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

  if (isLoading) return <div className="h-64 animate-pulse rounded-lg bg-gray-100" />;
  if (isError || !data) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-600">Couldn&apos;t load this enquiry.</p>
        <Link href="/account/enquiries" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline">Back to my enquiries</Link>
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
        <Link href="/account/enquiries" className="text-sm text-brand-600 hover:underline">← My enquiries</Link>
        <h1 className="mt-1 text-xl font-bold text-gray-900">{data.subject ?? data.reference}</h1>
        <p className="text-xs text-gray-500">
          {data.reference} · {String(data.status).replace(/_/g, " ")}
          {data.order_reference ? ` · Order ${data.order_reference}` : ""}
        </p>
      </div>

      <ul className="space-y-3">
        {data.messages.map((m, i) => (
          <li key={i} className={"flex " + (m.direction === "inbound" ? "justify-end" : "justify-start")}>
            <div className={"max-w-[80%] rounded-lg px-4 py-2 text-sm " + (m.direction === "inbound" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-800")}>
              <p className="whitespace-pre-line break-words">{m.body}</p>
              <p className={"mt-1 text-[11px] " + (m.direction === "inbound" ? "text-white/70" : "text-gray-400")}>
                {formatDateTime(m.created_at)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={onReply} className="mt-6 space-y-2">
        <label htmlFor="reply" className="sr-only">Your reply</label>
        <textarea
          id="reply"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Write a reply…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
        />
        <button type="submit" disabled={reply.isPending || !body.trim()} className="inline-flex h-10 items-center rounded-lg bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
          {reply.isPending ? "Sending…" : "Send reply"}
        </button>
      </form>
    </div>
  );
}
