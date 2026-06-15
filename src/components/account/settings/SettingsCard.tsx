"use client";

/** Section card wrapper for the settings groups (profile-settings §4). */
export function SettingsCard({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="rounded-lg border border-border bg-white p-5">
      <h2 id={`${id}-h`} className="text-h3 font-bold text-ink">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * A settings read row (kit `.ac2-set-row`): a muted key label stacked ABOVE the
 * ink value, with an optional right-aligned action/badge (`1fr auto` grid).
 * Replaces the old label-beside-value `flex justify-between` layout (RW7).
 */
export function ReadRow({
  label,
  value,
  action,
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-3 py-1">
      <div className="min-w-0">
        <dt className="mb-1 text-body-sm text-text-muted">{label}</dt>
        <dd className="break-words text-body font-semibold text-ink">{value}</dd>
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

/** "Verified" / "Unverified" badge with text equivalent (a11y). */
export function VerifyBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label font-medium ${
        verified ? "bg-success/10 text-success" : "bg-warning/15 text-[#B45309]"
      }`}
    >
      <span aria-hidden>{verified ? "✓" : "!"}</span>
      {verified ? "Verified" : "Unverified"}
    </span>
  );
}
