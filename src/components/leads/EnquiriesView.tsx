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
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-600">Couldn&apos;t load your enquiries.</p>
        <button type="button" onClick={() => refetch()} className="mt-2 text-sm font-medium text-brand-600 hover:underline">Try again</button>
      </div>
    );
  }
  const items = data ?? [];
  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-lg font-semibold text-gray-900">No enquiries yet</h1>
        <Link href="/help" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline">Contact us</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">My enquiries</h1>
      <ul className="space-y-3">
        {items.map((e) => (
          <li key={e.reference}>
            <Link href={`/account/enquiries/${e.reference}`} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-400">
              <span>
                <span className="block text-sm font-semibold text-gray-900">{e.subject}</span>
                <span className="block text-xs text-gray-500">{e.reference} · {formatDate(e.created_at)}</span>
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {String(e.status).replace(/_/g, " ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
