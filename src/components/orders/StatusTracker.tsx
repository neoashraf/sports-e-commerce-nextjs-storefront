/**
 * Order status tracker (order-detail.md, ord-storefront-fe AC2). Renders the
 * lifecycle as a stepped progress line with text + icon (never colour alone).
 * Cancelled/refunded short-circuit to a terminal note.
 */
// Mirrors the backend fulfilment lifecycle (order-enums.ts / fulfilment.service.ts):
// confirmed → processing → packed → shipped → out_for_delivery → delivered.
const FLOW = ["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"] as const;
const LABEL: Record<string, string> = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function StatusTracker({ status }: { status: string }) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <p className="rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
        ● {LABEL[status] ?? status}
      </p>
    );
  }

  const currentIdx = FLOW.indexOf(status as (typeof FLOW)[number]);
  // pending_payment sits before "confirmed" (index -1 here).
  const reached = (i: number) => currentIdx >= i;

  return (
    <ol className="flex items-center" aria-label="Order status">
      {FLOW.map((s, i) => (
        <li key={s} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center">
            <span
              aria-hidden="true"
              className={
                "grid h-7 w-7 place-items-center rounded-full text-xs font-bold " +
                (reached(i) ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-500")
              }
            >
              {reached(i) ? "✓" : i + 1}
            </span>
            <span className={"mt-1 text-[11px] " + (reached(i) ? "font-medium text-gray-900" : "text-gray-400")}>
              {LABEL[s]}
            </span>
          </div>
          {i < FLOW.length - 1 && (
            <span aria-hidden="true" className={"mx-1 h-0.5 flex-1 " + (reached(i + 1) ? "bg-brand-600" : "bg-gray-200")} />
          )}
        </li>
      ))}
    </ol>
  );
}
