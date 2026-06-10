import { Icon } from "@/components/ui/Icon";

/**
 * SportsVault TrustBar — thin strip of delivery / payment / exchange reassurances.
 * Each item = a lucide icon + short bold label. Use on a light (surface-50) or ink band.
 *
 * Pure display — `items` and `tone` are static props from the parent (the four BD
 * reassurances by default). The grid reflows at 360px (2 columns) up to one row of
 * equal columns on desktop, so nothing clips on mobile.
 *
 * Design source: docs/design/design-files/components/display/TrustBar.{jsx,prompt.md}
 */

export type TrustItem = { icon: string; label: string };

const DEFAULT_ITEMS: TrustItem[] = [
  { icon: "truck", label: "Delivery across Bangladesh" },
  { icon: "wallet", label: "Cash on Delivery" },
  { icon: "shield-check", label: "bKash / Nagad" },
  { icon: "refresh-cw", label: "Easy Exchange" },
];

export function TrustBar({
  items = DEFAULT_ITEMS,
  tone = "light",
}: {
  items?: TrustItem[];
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";

  return (
    <div
      className={
        "grid grid-cols-2 gap-4 px-4 py-3.5 sm:grid-cols-4 sm:px-8 " +
        (dark ? "bg-ink" : "border-y border-border bg-surface-50")
      }
    >
      {items.map((it, i) => (
        <div key={i} className="flex items-center justify-center gap-2.5">
          <Icon
            name={it.icon}
            size={20}
            className={dark ? "shrink-0 text-volt" : "shrink-0 text-volt-600"}
          />
          <span
            className={
              "text-body-sm font-semibold " + (dark ? "text-white" : "text-ink")
            }
          >
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}
