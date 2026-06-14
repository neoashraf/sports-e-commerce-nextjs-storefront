"use client";

import Link from "next/link";
import { useMyEnquiries } from "@/lib/api/hooks/leads";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { EnquiryStatusBadge } from "./EnquiryStatusBadge";

/**
 * My Enquiries list (my-enquiries.md, lead-form-fe AC3). Customer's enquiries,
 * each linking to its thread. RW7: kit ac2-enq-row — ref + type + subject +
 * semantic status badge (text + icon) + date + chevron. Empty/loading/error.
 */
const TYPE_LABEL: Record<string, string> = {
  general: "General",
  product_question: "Product",
  order_issue: "Order issue",
  claim_return: "Claim / return",
  bulk_order: "Bulk order",
  feedback: "Feedback",
};
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
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-100" aria-hidden="true">
          <Icon name="inbox" size={26} className="text-text-muted" />
        </span>
        <div>
          <h1 className="text-h3 font-bold text-ink">No enquiries yet</h1>
          <p className="mt-1 text-body-sm text-text-muted">When you contact us, your enquiries show up here.</p>
        </div>
        <Link href="/help" className="inline-flex h-11 items-center rounded-md bg-volt px-6 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600">
          Get help
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-h1 font-bold tracking-snug text-ink">My enquiries</h1>
      <ul className="space-y-3">
        {items.map((e) => (
          <li key={e.reference}>
            <Link
              href={`/account/enquiries/${e.reference}`}
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-shadow duration-micro ease-out hover:shadow-card motion-reduce:transition-none"
            >
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-label font-semibold text-text-muted">{e.reference}</span>
                  <span className="rounded-full bg-surface-100 px-2 py-0.5 text-label text-text-muted">
                    {TYPE_LABEL[String(e.type)] ?? String(e.type).replace(/_/g, " ")}
                  </span>
                </span>
                <span className="mt-0.5 block break-words text-body-sm font-semibold text-ink">{e.subject}</span>
                <span className="block text-label text-text-faint">{formatDate(e.created_at)}</span>
              </span>
              <EnquiryStatusBadge status={String(e.status)} />
              <Icon name="chevron-right" size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
