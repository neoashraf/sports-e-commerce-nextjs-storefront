import { Icon } from "@/components/ui/Icon";

/**
 * Semantic order-status badge (kit `StatusBadge` / `.ac-badge`) — text + icon, never
 * colour alone (a11y). Each fulfilment status carries the kit's exact tint:
 * cyan (in-flight: confirmed / shipped / out-for-delivery), amber (processing / packed),
 * green (delivered), grey (cancelled / refunded). 26px pill, 12px/700.
 */
type Tone = { label: string; icon: string; bg: string; color: string };

// Literal hex (not CSS vars) so the inline styles resolve regardless of which token
// layer is loaded — matches the kit's --cyan-600 / --success / --surface-100 values.
const CYAN = { bg: "rgba(0,184,204,0.12)", color: "#00B8CC" };
const AMBER = { bg: "rgba(245,158,11,0.16)", color: "#B45309" };
const GREEN = { bg: "rgba(14,159,110,0.12)", color: "#0E9F6E" };
const GREY = { bg: "#EFF1F4", color: "#5B616E" };

const MAP: Record<string, Tone> = {
  pending_payment: { label: "Pending payment", icon: "clock", ...AMBER },
  confirmed: { label: "Confirmed", icon: "check-circle", ...CYAN },
  processing: { label: "Processing", icon: "loader", ...AMBER },
  packed: { label: "Packed", icon: "package", ...AMBER },
  shipped: { label: "Shipped", icon: "truck", ...CYAN },
  out_for_delivery: { label: "Out for delivery", icon: "bike", ...CYAN },
  delivered: { label: "Delivered", icon: "check-circle", ...GREEN },
  cancelled: { label: "Cancelled", icon: "x-circle", ...GREY },
  refunded: { label: "Refunded", icon: "rotate-ccw", ...GREY },
};

export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status.replace(/_/g, " "), icon: "circle", ...GREY };
  return (
    <span
      className="inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] font-bold capitalize"
      style={{ background: s.bg, color: s.color }}
    >
      <Icon name={s.icon} size={13} color={s.color} aria-hidden="true" />
      {s.label}
    </span>
  );
}
