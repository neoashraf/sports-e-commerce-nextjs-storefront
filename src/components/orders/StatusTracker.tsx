import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/**
 * Order status tracker (order-detail.md, ord-storefront-fe AC2) — RW7 vertical
 * stepper per ui_kits/account-orders. Each step: done = white check on ink,
 * current = dot on volt with a volt glow ring, todo = number on surface; the
 * connectors fill to ink up to the current step. Status is conveyed by text +
 * icon, never colour alone. Cancelled/refunded short-circuit to a terminal note.
 * An optional `shipmentNote` renders inside the timeline at the shipped step.
 */
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

export function StatusTracker({
  status,
  shipmentNote,
}: {
  status: string;
  shipmentNote?: ReactNode;
}) {
  if (status === "cancelled" || status === "refunded") {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-error/10 px-4 py-3 text-body-sm font-medium text-error">
        <Icon name="x-circle" size={16} aria-hidden="true" />
        {LABEL[status] ?? status}
      </p>
    );
  }

  const currentIdx = FLOW.indexOf(status as (typeof FLOW)[number]);

  return (
    <ol aria-label="Order status">
      {FLOW.map((s, i) => {
        const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "todo";
        const isLast = i === FLOW.length - 1;
        return (
          <li key={s} className="grid grid-cols-[28px_1fr] gap-3">
            {/* Dot + connector column */}
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-label font-bold " +
                  (state === "done"
                    ? "bg-ink text-white"
                    : state === "current"
                      ? "bg-volt text-ink shadow-[0_0_0_4px_rgba(200,255,0,0.30)]"
                      : "border border-border bg-surface-100 text-text-faint")
                }
              >
                {state === "done" ? (
                  <Icon name="check" size={15} strokeWidth={3} />
                ) : state === "current" ? (
                  <Icon name="circle-dot" size={15} />
                ) : (
                  i + 1
                )}
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={"my-1 w-0.5 flex-1 " + (i < currentIdx ? "bg-ink" : "bg-border")}
                />
              )}
            </div>
            {/* Label + (at the shipped step) the shipment note */}
            <div className={isLast ? "pb-0" : "pb-4"}>
              <span
                className={
                  "text-body-sm " +
                  (state === "todo" ? "text-text-muted" : "font-semibold text-ink")
                }
              >
                {LABEL[s]}
              </span>
              {s === "shipped" && shipmentNote && <div className="mt-2">{shipmentNote}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Cyan shipment pill (kit `.ac-ship-note`) — used inside the timeline + on /track. */
export function ShipmentNote({ courier, tracking }: { courier?: string | null; tracking?: string | null }) {
  if (!courier && !tracking) return null;
  return (
    <p className="inline-flex items-center gap-2 rounded-md border border-cyan-600/40 bg-cyan-600/[0.07] px-3 py-1.5 text-body-sm text-ink">
      <Icon name="truck" size={15} color="var(--cyan-600)" aria-hidden="true" />
      <span className="break-words">
        Shipped via {courier ?? "courier"}
        {tracking ? ` · Tracking ${tracking}` : ""}
      </span>
    </p>
  );
}
