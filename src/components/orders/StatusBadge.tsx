import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";

/**
 * Semantic order-status badge (kit `StatusBadge` map) — text + icon, never colour
 * alone (a11y). Maps each fulfilment status to a Badge variant + a Lucide glyph.
 */
type Variant = "neutral" | "inStock" | "lowStock" | "outStock";

const MAP: Record<string, { label: string; variant: Variant; icon: string }> = {
  pending_payment: { label: "Pending payment", variant: "lowStock", icon: "clock" },
  confirmed: { label: "Confirmed", variant: "neutral", icon: "check" },
  processing: { label: "Processing", variant: "neutral", icon: "loader" },
  packed: { label: "Packed", variant: "neutral", icon: "package" },
  shipped: { label: "Shipped", variant: "neutral", icon: "truck" },
  out_for_delivery: { label: "Out for delivery", variant: "neutral", icon: "bike" },
  delivered: { label: "Delivered", variant: "inStock", icon: "check-circle" },
  cancelled: { label: "Cancelled", variant: "outStock", icon: "x-circle" },
  refunded: { label: "Refunded", variant: "outStock", icon: "rotate-ccw" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { label: status.replace(/_/g, " "), variant: "neutral" as const, icon: "circle" };
  return (
    <Badge variant={s.variant}>
      <span className="inline-flex items-center gap-1">
        <Icon name={s.icon} size={12} aria-hidden="true" />
        {s.label}
      </span>
    </Badge>
  );
}
