"use client";

import { Icon } from "@/components/ui/Icon";

/**
 * Checkout step indicator — faithful port of the design kit CheckoutSteps.jsx.
 * 3 steps with done (check on ink) / active (numeral on volt) / todo (numeral on
 * surface-100) states, joined by thin separators. Labels collapse to the active
 * step only on very small screens.
 */
const STEP_LABELS = ["Delivery address", "Delivery & payment", "Review your order"] as const;

export function CheckoutSteps({ active }: { active: 1 | 2 | 3 }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 py-[18px] pb-1">
      {STEP_LABELS.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < active;
        const isActive = n === active;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span className="inline-flex items-center gap-2">
              <span
                className={
                  "grid h-[26px] w-[26px] place-items-center rounded-full text-[13px] font-bold " +
                  (done
                    ? "bg-ink text-white"
                    : isActive
                      ? "bg-volt text-ink"
                      : "border border-border bg-surface-100 text-text-muted")
                }
              >
                {done ? <Icon name="check" size={15} color="#fff" strokeWidth={3} aria-hidden="true" /> : n}
              </span>
              <span
                className={
                  "text-body-sm font-semibold " +
                  (isActive ? "text-ink" : done ? "text-ink" : "text-text-muted") +
                  (isActive ? "" : " hidden sm:inline")
                }
              >
                {label}
              </span>
            </span>
            {n < 3 && <span aria-hidden="true" className="h-px min-w-[18px] flex-1 bg-border-strong" />}
          </li>
        );
      })}
    </ol>
  );
}
