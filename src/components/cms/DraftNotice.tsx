import { Icon } from "@/components/ui/Icon";

/**
 * Interim "this copy isn't final" banner for the static legal pages (Terms,
 * Privacy). These pages ship with placeholder/draft copy until the client's
 * legal text is provided and seeded via the CMS (FR-CMS-042); this notice makes
 * the draft status unmistakable and keeps the content non-binding.
 * Remove together with the static pages once the CMS seed lands.
 */
export function DraftNotice() {
  return (
    <div
      role="note"
      className="mb-8 flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-[14px] leading-relaxed text-ink-700"
    >
      <Icon name="triangle-alert" size={16} className="mt-0.5 shrink-0 text-warning" />
      <span>
        <strong className="font-semibold text-ink">Draft — pending legal sign-off.</strong>{" "}
        This is placeholder content and is <strong className="font-semibold">not legally binding</strong>.
        The final policy text will be provided by SportsVault before launch.
      </span>
    </div>
  );
}
