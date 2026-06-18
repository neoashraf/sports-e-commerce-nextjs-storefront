import type { Metadata } from "next";
import { StaticPageArticle } from "@/components/cms/StaticPageArticle";
import { DraftNotice } from "@/components/cms/DraftNotice";

/**
 * Interim STATIC Privacy Policy page — `/pages/privacy-policy`.
 *
 * This static segment intentionally takes precedence over the dynamic
 * `/pages/[slug]` CMS route so the link works before the CMS is seeded
 * (cms-legal-static-pages-fe; deviation from FR-CMS-042, static-now).
 * When the CMS seeds the real `privacy-policy` page, DELETE this file and the
 * dynamic route will serve the managed content at the same URL.
 *
 * TODO(content): the copy below is a DRAFT skeleton — replace with the
 * client-approved, bilingual (English + বাংলা) legal text before launch.
 */
export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SportsVault collects, uses, and protects your personal information when you shop with us.",
};

export default function PrivacyPolicyPage() {
  return (
    <StaticPageArticle title="Privacy Policy">
      <DraftNotice />

      <p>
        This Privacy Policy explains what personal information SportsVault
        collects, how we use it, and the choices you have. It applies to your use
        of our storefront and services.
      </p>

      <h2>1. Information we collect</h2>
      <p>
        We collect details you provide — such as your name, phone number, email,
        and delivery address — and information generated as you browse and order,
        including device and usage data.
      </p>

      <h2>2. How we use your information</h2>
      <p>
        We use your information to process orders, arrange delivery, provide
        support, prevent fraud, and — with your consent — send promotional
        updates. You can opt out of marketing at any time.
      </p>

      <h2>3. Sharing</h2>
      <p>
        We share data only as needed with delivery partners and payment providers
        (bKash, SSLCommerz) to fulfil your order, and where required by law.
      </p>

      <h2>4. Data security &amp; retention</h2>
      <p>
        We apply reasonable safeguards to protect your information and retain it
        only as long as necessary for the purposes described here or as required
        by law.
      </p>

      <h2>5. Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal
        information, subject to applicable law.
      </p>

      <h2>6. Contact</h2>
      <p>
        For privacy questions or requests, reach us through the{" "}
        <a href="/pages/contact">Contact</a> page.
      </p>

      {/* TODO(content): add the বাংলা translation of every section above. */}
      <h2 lang="bn">বাংলা সংস্করণ</h2>
      <p lang="bn">
        এই গোপনীয়তা নীতির বাংলা সংস্করণ চূড়ান্ত অনুমোদনের পর এখানে যুক্ত করা হবে।
      </p>
    </StaticPageArticle>
  );
}
