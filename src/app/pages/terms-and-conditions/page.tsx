import type { Metadata } from "next";
import { StaticPageArticle } from "@/components/cms/StaticPageArticle";
import { DraftNotice } from "@/components/cms/DraftNotice";

/**
 * Interim STATIC Terms & Conditions page — `/pages/terms-and-conditions`.
 *
 * This static segment intentionally takes precedence over the dynamic
 * `/pages/[slug]` CMS route so the link works before the CMS is seeded
 * (cms-legal-static-pages-fe; deviation from FR-CMS-042, static-now).
 * When the CMS seeds the real `terms-and-conditions` page, DELETE this file and
 * the dynamic route will serve the managed content at the same URL.
 *
 * TODO(content): the copy below is a DRAFT skeleton — replace with the
 * client-approved, bilingual (English + বাংলা) legal text before launch.
 */
export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms governing your use of the SportsVault storefront, orders, payments, delivery, and returns.",
};

export default function TermsAndConditionsPage() {
  return (
    <StaticPageArticle title="Terms & Conditions">
      <DraftNotice />

      <p>
        These Terms &amp; Conditions govern your access to and use of the
        SportsVault online store. By browsing the site, creating an account, or
        placing an order, you agree to these terms.
      </p>

      <h2>1. Eligibility &amp; accounts</h2>
      <p>
        You must provide accurate contact details when registering or checking
        out. You are responsible for activity that occurs under your account.
      </p>

      <h2>2. Orders &amp; pricing</h2>
      <p>
        All prices are shown in Bangladeshi Taka (BDT) and include applicable
        charges as stated at checkout. We may correct pricing errors and cancel
        affected orders before dispatch.
      </p>

      <h2>3. Payment</h2>
      <p>
        We accept Cash on Delivery, bKash, and card payments via SSLCommerz. Your
        order is confirmed once payment (or COD selection) is successfully placed.
      </p>

      <h2>4. Delivery</h2>
      <p>
        Delivery timelines and charges depend on your delivery zone and are shown
        at checkout. Title and risk pass to you on delivery.
      </p>

      <h2>5. Returns &amp; exchange</h2>
      <p>
        Eligible items may be exchanged in line with our Exchange Policy. Please
        refer to the Exchange Policy page for conditions and timelines.
      </p>

      <h2>6. Limitation of liability &amp; governing law</h2>
      <p>
        These terms are governed by the laws of Bangladesh. Nothing here limits
        any rights you have under applicable consumer-protection law.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about these terms? Reach us through the{" "}
        <a href="/pages/contact">Contact</a> page.
      </p>

      {/* TODO(content): add the বাংলা translation of every section above. */}
      <h2 lang="bn">বাংলা সংস্করণ</h2>
      <p lang="bn">
        এই শর্তাবলীর বাংলা সংস্করণ চূড়ান্ত অনুমোদনের পর এখানে যুক্ত করা হবে।
      </p>
    </StaticPageArticle>
  );
}
