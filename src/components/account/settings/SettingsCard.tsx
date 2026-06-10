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
