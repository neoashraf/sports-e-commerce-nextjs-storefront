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
    <section id={id} aria-labelledby={`${id}-h`} className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 id={`${id}-h`} className="text-base font-semibold text-gray-900">
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
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        verified ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"
      }`}
    >
      <span aria-hidden>{verified ? "✓" : "!"}</span>
      {verified ? "Verified" : "Unverified"}
    </span>
  );
}
