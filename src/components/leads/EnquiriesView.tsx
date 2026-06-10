"use client";

import Link from "next/link";
import { useMyEnquiries } from "@/lib/api/hooks/leads";
import { formatDate } from "@/lib/format";

/**
 * My Enquiries list (my-enquiries.md, lead-form-fe AC3). Customer's enquiries,
 * each linking to its thread. Empty + loading + error states.
 */
export function EnquiriesView() {
  const { data, isLoading, isError, refetch } = useMyEnquiries();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-surface-100" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-body-sm text-text-muted">Couldn&apos;t load your enquiries.</p>
        <button type="button" onClick={() => refetch()} className="mt-2 text-body-sm font-semibold text-volt-600 hover:underline">Try again</button>
      </div>
    );
  }
  const items = data ?? [];
  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-h3 font-bold text-ink">No enquiries yet</h1>
        <Link href="/help" className="mt-2 inline-block text-body-sm font-semibold text-volt-600 hover:underline">Contact us</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-h1 font-bold tracking-snug text-ink">My enquiries</h1>
      <ul className="space-y-3">
        {items.map((e) => (
          <li key={e.reference}>
            <Link href={`/account/enquiries/${e.reference}`} className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors duration-micro ease-out hover:border-border-strong">
              <span>
                <span className="block text-body-sm font-semibold text-ink">{e.subject}</span>
                <span className="block text-body-sm text-text-muted">{e.reference} · {formatDate(e.created_at)}</span>
              </span>
              <span className="rounded-full bg-surface-100 px-2.5 py-0.5 text-body-sm font-medium text-ink">
                {String(e.status).replace(/_/g, " ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
