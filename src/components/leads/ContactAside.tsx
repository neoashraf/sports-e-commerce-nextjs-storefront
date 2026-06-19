import { Icon } from "@/components/ui/Icon";

/**
 * Contact-info aside for the Contact / Get Help page (get-help-form.md §4 —
 * shown right of the form on desktop, stacked on mobile). Ported from the
 * design kit's ContactAside.
 *
 * NOTE: SportsVault has no physical store, so the kit's "Visit"/address card is
 * intentionally omitted. Contacts are the canonical store support details —
 * also on the Terms/Privacy pages and recorded in docs/srs/13-content.md §5.5.
 */

const SUPPORT_PHONE = "+880 1700-000000";
const SUPPORT_PHONE_TEL = "+8801700000000";
const SUPPORT_EMAIL = "info@sportsvault.com.bd";

export function ContactAside() {
  return (
    <aside aria-label="Contact information" className="space-y-4">
      {/* Reach us directly — dark card with volt accent icons */}
      <div className="rounded-lg bg-ink p-5 text-white">
        <h2 className="text-label font-semibold uppercase tracking-wide text-volt-600">
          Reach us directly
        </h2>
        <ul className="mt-4 space-y-4">
          <li className="flex items-start gap-3">
            <Icon name="phone" size={16} className="mt-0.5 shrink-0 text-volt-600" />
            <div>
              <div className="text-label text-ink-500">Hotline</div>
              <a
                href={`tel:${SUPPORT_PHONE_TEL}`}
                className="text-body-sm font-medium text-white underline-offset-2 hover:underline focus-visible:underline"
              >
                {SUPPORT_PHONE}
              </a>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Icon name="mail" size={16} className="mt-0.5 shrink-0 text-volt-600" />
            <div className="min-w-0">
              <div className="text-label text-ink-500">Email</div>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="block break-all text-body-sm font-medium text-white underline-offset-2 hover:underline focus-visible:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>
          </li>
        </ul>
      </div>

      {/* Opening hours — light card */}
      <div className="rounded-lg border border-border bg-white p-5">
        <h2 className="text-label font-semibold uppercase tracking-wide text-ink">
          Opening hours
        </h2>
        <div className="mt-4 flex items-start gap-3">
          <Icon name="clock" size={16} className="mt-0.5 shrink-0 text-ink" />
          <div className="flex w-full items-center justify-between gap-3">
            <span className="text-body-sm text-text-muted">Support hours</span>
            <span className="text-body-sm font-semibold text-ink">9:00 AM – 6:00 PM</span>
          </div>
        </div>
        <p className="mt-3 text-label leading-relaxed text-text-muted">
          Closed on government holidays. We usually reply within one working day.
        </p>
      </div>
    </aside>
  );
}
