import type { Metadata } from "next";
import { StaticPageArticle } from "@/components/cms/StaticPageArticle";

/**
 * STATIC Privacy Policy page — `/pages/privacy-policy`.
 *
 * Served as a static storefront page by decision (2026-06-18) — these legal
 * pages are deliberately NOT seeded into the CMS (accepted deviation from
 * FR-CMS-042). This static segment takes precedence over the dynamic
 * `/pages/[slug]` route; the same URL keeps working if it is ever moved into
 * the CMS in future.
 *
 * Copy adapted from the client-supplied reference policy; SportsVault contact
 * details per docs/srs/13-content.md §5.5.
 */
export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SportsVault collects, uses, shares, and protects your personal information when you shop with us.",
};

const LAST_UPDATED = "2026-06-18";

export default function PrivacyPolicyPage() {
  return (
    <StaticPageArticle title="Privacy Policy" updatedAt={LAST_UPDATED}>
      <p>
        SportsVault respects your privacy. This policy explains what personal
        information we collect, how we use and share it, and the choices you
        have. By using this website, you consent to the practices described here.
        For any privacy question, email{" "}
        <a href="mailto:sabbir.cytrax@gmail.com">sabbir.cytrax@gmail.com</a>.
      </p>

      <h2>1. Information we collect</h2>
      <p>We may collect:</p>
      <ul>
        <li>
          Registration details — name, email, phone number, gender, date of
          birth, delivery and billing addresses, postal code, and interests.
        </li>
        <li>Order and transaction history.</li>
        <li>
          Website usage data — pages viewed, IP address, browser and device
          information, and cookie data.
        </li>
      </ul>
      <p>
        <strong>Payment security:</strong> SportsVault does not store your card
        number, expiry date, CVV, bank account, or mobile-wallet credentials.
        Payment data is encrypted with SSL and transmitted securely to our
        payment processors (bKash, SSLCommerz) only.
      </p>

      <h2>2. How we collect it</h2>
      <p>
        We collect information when you register, check out as a guest, place an
        order, take part in surveys or promotions, or simply browse — through
        forms, cookies, and web-server logs.
      </p>

      <h2>3. How we use your information</h2>
      <ul>
        <li>To process orders, arrange delivery, and provide support.</li>
        <li>
          To send registration confirmations, one-time passwords (OTP), and
          order-status updates.
        </li>
        <li>
          To send promotional offers and newsletters — only with your consent,
          which you may withdraw at any time.
        </li>
        <li>
          To personalise your shopping experience, diagnose problems, and improve
          the website.
        </li>
        <li>To retain transaction records where required by law.</li>
      </ul>

      <h2>4. How we share your information</h2>
      <p>
        We do not sell your personal information. We share it only as needed:
      </p>
      <ul>
        <li>
          With service providers — delivery partners and payment processors — who
          may use it only to fulfil your order.
        </li>
        <li>
          When required by law, court order, or law enforcement, or to
          investigate fraud or protect users&apos; safety.
        </li>
        <li>In aggregate, non-identifying form, with partners.</li>
      </ul>

      <h2>5. Cookies</h2>
      <p>
        We use cookies to keep your session secure, remember your preferences,
        and understand how the site is used. You can accept or reject cookies in
        your browser, though rejecting them may limit some features.
      </p>

      <h2>6. Data security</h2>
      <p>
        Your information is stored in databases behind firewalls with restricted,
        password-protected access, and sensitive data is encrypted with SSL. No
        method of transmission over the Internet is completely secure, so while
        we follow industry standards we cannot guarantee absolute security.
      </p>

      <h2>7. Your choices</h2>
      <ul>
        <li>
          Opt in or out of marketing messages from your account settings or by
          contacting us. You cannot opt out of essential service messages while
          you hold an account.
        </li>
        <li>
          Correct, update, or delete your personal information from your account
          settings or by emailing us.
        </li>
        <li>
          Request account deletion — we remove your information from active
          databases, though some data may remain on backups.
        </li>
      </ul>

      <h2>8. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Changes take effect when
        posted, and we will notify you of significant changes via the website or
        email.
      </p>

      <h2>9. Contact us</h2>
      <p>
        For privacy questions or requests, contact us at{" "}
        <a href="tel:+8801403750170">+880&nbsp;1403-750170</a> or{" "}
        <a href="mailto:sabbir.cytrax@gmail.com">sabbir.cytrax@gmail.com</a>, or
        through the <a href="/pages/contact">Contact</a> page.
      </p>

      {/* Bilingual structure per SRS §8 — full Bangla translation supplied on request. */}
      <h2 lang="bn">বাংলা সংস্করণ</h2>
      <p lang="bn">
        এই গোপনীয়তা নীতির বাংলা সংস্করণের জন্য{" "}
        <a href="mailto:sabbir.cytrax@gmail.com">sabbir.cytrax@gmail.com</a>{" "}
        ঠিকানায় যোগাযোগ করুন।
      </p>
    </StaticPageArticle>
  );
}
