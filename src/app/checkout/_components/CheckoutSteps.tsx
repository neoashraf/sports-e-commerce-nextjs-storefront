"use client";

import { Icon } from "@/components/ui/Icon";

/**
 * Checkout step indicator — based on the design kit CheckoutSteps.jsx.
 * 3 steps with done (check on ink) / active (numeral on volt) / todo (numeral on
 * surface-100) states, joined by thin separators. ALL three labels show at every
 * size: on mobile each step stacks (number above a centered label) so the three
 * fit on one row; from 560px up they lay out inline (number beside label).
 *
 * When `onStep` is provided, any step up to `maxReached` becomes a button so the
 * shopper can jump back to (or to an already-unlocked) step. This is what makes the
 * mobile step-by-step wizard navigable; future steps stay non-interactive so they
 * can't be reached unvalidated.
 */
const STEP_LABELS = ["Delivery address", "Delivery & payment", "Review your order"] as const;

export function CheckoutSteps({
  active,
  maxReached,
  onStep,
}: {
  active: 1 | 2 | 3;
  maxReached?: 1 | 2 | 3;
  onStep?: (n: 1 | 2 | 3) => void;
}) {
  const reached = maxReached ?? active;
  return (
    // The connector between steps is the flex-growing element (kit: .co-step-sep
    // { flex: 1 }) so the row never forces equal thirds. Steps stay at natural width.
    <ol className="flex items-center gap-2 py-[18px] pb-1">
      {STEP_LABELS.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < active;
        const isActive = n === active;
        const navigable = !!onStep && n <= reached && n !== active;
        const numEl = (
          <span
            className={
              // shrink-0: the circle keeps its 26px (kit .co-step-num { flex: none })
              // and never squishes when the row is tight.
              "grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full text-[13px] font-bold " +
              (done
                ? "bg-ink text-white"
                : isActive
                  ? "bg-volt text-ink"
                  : "border border-border bg-surface-100 text-text-muted")
            }
          >
            {done ? <Icon name="check" size={15} color="#fff" strokeWidth={3} aria-hidden="true" /> : n}
          </span>
        );
        const labelEl = (
          <span
            className={
              // ALL labels show. Mobile: centered, may wrap to 2 lines under the circle.
              // ≥560px: inline beside the circle, single line.
              "text-center text-[11px] font-semibold leading-tight min-[560px]:text-left min-[560px]:text-body-sm min-[560px]:whitespace-nowrap " +
              (isActive ? "text-ink" : done ? "text-ink" : "text-text-muted")
            }
          >
            {label}
          </span>
        );
        // Mobile: stack number above a centered label (so all three fit on one row).
        // ≥560px: number beside the label.
        const stepInner = "flex flex-col items-center gap-1 min-[560px]:flex-row min-[560px]:gap-2";
        return (
          <li key={label} className="flex flex-1 items-start gap-2 last:flex-none min-[560px]:items-center">
            {navigable ? (
              <button
                type="button"
                onClick={() => onStep!(n)}
                aria-label={`Go to step ${n}: ${label}`}
                className={
                  "shrink-0 rounded-sm transition-opacity duration-micro ease-out hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-volt-600 " +
                  stepInner
                }
              >
                {numEl}
                {labelEl}
              </button>
            ) : (
              <span className={"shrink-0 " + stepInner}>
                {numEl}
                {labelEl}
              </span>
            )}
            {/* Connector aligns to the circle's vertical centre. On mobile the step is
                taller (number stacked over label), so pin the line to the top and nudge
                it down 13px (half the 26px circle); ≥560px it's a single row, so just
                self-center with no offset. */}
            {n < 3 && (
              <span
                aria-hidden="true"
                className="mt-[13px] h-px min-w-[12px] flex-1 self-start bg-border-strong min-[560px]:mt-0 min-[560px]:min-w-[18px] min-[560px]:self-center"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
