import type { Metadata } from "next";
import { LeadForm } from "@/components/leads/LeadForm";
import { ContactAside } from "@/components/leads/ContactAside";

/**
 * STATIC Contact page — `/pages/contact` (LEAD, get-help-form.md).
 *
 * Hosts the reusable Get Help form (left) + the contact-info aside (right on
 * desktop) — the footer "Contact" link resolves here. Served as a static
 * segment that takes precedence over the dynamic `/pages/[slug]` CMS route, in
 * line with the static legal pages; the same URL works if it is ever moved to
 * the CMS later.
 */
export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with SportsVault — questions about a product, an order, a claim or return. Send us a message and we'll get back to you.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-label font-semibold uppercase tracking-wide text-volt-600">
        Support
      </p>
      <h1 className="mt-1 text-[32px] font-extrabold leading-[1.15] tracking-tight text-ink sm:text-[42px]">
        Contact
      </h1>
      <p className="mt-3 max-w-2xl text-body text-text-muted">
        Questions about a product, an order, or a return? Send us a message and
        we&apos;ll get back to you.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <section aria-label="Send us a message" className="rounded-lg border border-border bg-white p-5 sm:p-6">
          <h2 className="mb-4 text-h3 font-bold text-ink">Send us a message</h2>
          <LeadForm source="contact_page" />
        </section>

        <ContactAside />
      </div>
    </div>
  );
}
