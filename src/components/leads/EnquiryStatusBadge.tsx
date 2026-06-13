import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";

/**
 * Semantic enquiry-status badge (kit `EnqBadge`) — text + icon, never colour
 * alone. The lead `status` is free-form; map the known values (open / answered /
 * in_progress / closed / resolved) and default gracefully for anything else.
 */
const MAP: Record<string, { label: string; variant: "neutral" | "inStock" | "lowStock"; icon: string }> = {
  new: { label: "Open", variant: "lowStock", icon: "circle-dot" },
  open: { label: "Open", variant: "lowStock", icon: "circle-dot" },
  awaiting_customer: { label: "Answered", variant: "neutral", icon: "check-circle" },
  answered: { label: "Answered", variant: "neutral", icon: "check-circle" },
  in_progress: { label: "Answered", variant: "neutral", icon: "check-circle" },
  resolved: { label: "Closed", variant: "inStock", icon: "lock" },
  closed: { label: "Closed", variant: "inStock", icon: "lock" },
};

export function EnquiryStatusBadge({ status }: { status: string }) {
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
