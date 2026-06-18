import type { Metadata } from "next";
import { StaticPageArticle } from "@/components/cms/StaticPageArticle";

/**
 * STATIC Terms & Conditions page — `/pages/terms-and-conditions`.
 *
 * This static segment intentionally takes precedence over the dynamic
 * `/pages/[slug]` CMS route so the page is served before the CMS is seeded
 * (cms-legal-static-pages-fe; deviation from FR-CMS-042, static-now).
 * When the CMS seeds the managed `terms-and-conditions` page, DELETE this file
 * and the dynamic route will serve it at the same URL.
 *
 * Copy adapted from the client-supplied reference policy; SportsVault contact
 * details per docs/srs/13-content.md §5.5.
 */
export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms governing your use of the SportsVault store — ordering, delivery, exchange, refunds, and support.",
};

const LAST_UPDATED = "2026-06-18";

export default function TermsAndConditionsPage() {
  return (
    <StaticPageArticle title="Terms & Conditions" updatedAt={LAST_UPDATED}>
      <p>
        Welcome to SportsVault. Our mission is to provide the best customer
        service and shopping experience possible. By browsing this website,
        creating an account, or placing an order, you agree to the terms below.
      </p>

      <h2>1. Customer service</h2>
      <p>
        We are committed to quality customer service. Please inspect your
        products on delivery and report any damage, defect, or sizing issue to
        the delivery person immediately. Our support team is available from
        9:00&nbsp;AM to 6:00&nbsp;PM (excluding government holidays) at{" "}
        <a href="tel:+8801403750170">+880&nbsp;1403-750170</a> or by email at{" "}
        <a href="mailto:sabbir.cytrax@gmail.com">sabbir.cytrax@gmail.com</a>.
      </p>

      <h2>2. Ordering</h2>
      <p>
        Orders can be placed only for in-stock items shown on the website. Each
        order ships to a single address — place separate orders for different
        destinations. Paid orders cannot be cancelled once they have been
        shipped. For any order-related query, contact customer service during
        business hours.
      </p>

      <h2>3. Delivery</h2>
      <p>
        We aim to deliver within 2–3 working days inside Dhaka, 3–5 working days
        to district headquarters, and 5–7 working days to remote areas. Standard
        delivery charges are ৳70 inside Dhaka, ৳90 in nearby areas, and ৳120
        outside Dhaka. Orders that exceed our weight limits (25&nbsp;kg in Dhaka,
        30&nbsp;kg elsewhere) may incur additional charges.
      </p>
      <p>
        Orders ship Sunday through Thursday, excluding public holidays. Cash on
        Delivery orders outside Dhaka are subject to a 1% surcharge on the
        product price (including VAT). Delivery may occasionally be delayed by
        circumstances beyond our control.
      </p>

      <h2>4. Returns &amp; exchange</h2>
      <p>
        Products may be exchanged within 72 hours of delivery if they are unused,
        clean, and returned with intact hang tags and the original invoice. Each
        eligible product may be exchanged once, for an item of the same or higher
        value, with any price difference payable by the customer. Discounted
        products cannot be returned or exchanged. To start an exchange, please
        call customer service. Applicable delivery charges apply to returns and
        exchanges placed under Cash on Delivery.
      </p>

      <h2>5. Refunds</h2>
      <p>
        Approved refunds are processed through the original payment method within
        7–10 working days.
      </p>

      <h2>6. Contact us</h2>
      <p>
        Questions about these terms? Reach us at{" "}
        <a href="tel:+8801403750170">+880&nbsp;1403-750170</a> or{" "}
        <a href="mailto:sabbir.cytrax@gmail.com">sabbir.cytrax@gmail.com</a>, or
        through the <a href="/pages/contact">Contact</a> page.
      </p>

      {/* Bilingual structure per SRS §8 — full Bangla translation supplied on request. */}
      <h2 lang="bn">বাংলা সংস্করণ</h2>
      <p lang="bn">
        এই শর্তাবলীর বাংলা সংস্করণের জন্য{" "}
        <a href="mailto:sabbir.cytrax@gmail.com">sabbir.cytrax@gmail.com</a>{" "}
        ঠিকানায় যোগাযোগ করুন।
      </p>
    </StaticPageArticle>
  );
}
