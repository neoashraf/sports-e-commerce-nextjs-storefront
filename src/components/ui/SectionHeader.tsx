import Link from "next/link";

/**
 * SportsVault SectionHeader — uppercase volt eyebrow + semantic h2 + optional
 * "View all →" link (ink at rest, cyan-600 with a cyan underline on hover/focus).
 * Consistent across Featured / New Arrivals / Best Sellers, PLP, PDP rails.
 *
 * Pure display — eyebrow/title/href are static props from the parent. Bangla-safe:
 * the h2 wraps and never clips. Pass `titleId` to let a parent reference it via
 * aria-labelledby.
 *
 * Design source: docs/design/design-files/components/display/SectionHeader.{jsx,prompt.md}
 */
export function SectionHeader({
  eyebrow,
  title,
  titleId,
  actionLabel = "View all",
  href,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  titleId?: string;
  actionLabel?: string;
  href?: string;
  onAction?: () => void;
}) {
  const action =
    href || onAction ? (
      <>{actionLabel} →</>
    ) : null;

  const linkClass =
    "group inline-flex shrink-0 items-center gap-1 whitespace-nowrap border-b-2 border-transparent pb-0.5 " +
    "text-[14px] font-semibold text-ink transition-colors duration-micro ease-out " +
    "hover:border-cyan-600 hover:text-cyan-600 focus-visible:border-cyan-600 focus-visible:text-cyan-600";

  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow && (
          <span className="text-label font-semibold uppercase tracking-wide text-volt-600">
            {eyebrow}
          </span>
        )}
        <h2 id={titleId} className="text-h2 font-bold tracking-snug text-ink">
          {title}
        </h2>
      </div>

      {action &&
        (href ? (
          <Link href={href} className={linkClass}>
            {action}
          </Link>
        ) : (
          <button type="button" onClick={onAction} className={linkClass}>
            {action}
          </button>
        ))}
    </div>
  );
}
