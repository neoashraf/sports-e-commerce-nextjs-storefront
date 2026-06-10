"use client";

import Link from "next/link";
import { useFooterMenus } from "@/lib/api/hooks/content";
import type { MenuNode } from "@/lib/api/schemas/content";
import { resolveLink, isExternalLink } from "@/lib/cms/links";
import { NewsletterStub } from "./NewsletterStub";

type Column = { title: string; items: { label: string; href: string; external?: boolean }[] };

/**
 * Hard-coded BD policy/about columns — the fallback when the CMS `menus.footer`
 * is absent (storefront-shell §13.1, AC6). Policy links route to `/pages/<slug>`
 * whose render is the DEFERRED CMS page route (target shows a placeholder).
 */
const FALLBACK_COLUMNS: Column[] = [
  {
    title: "Customer Care",
    items: [
      { label: "Delivery Information", href: "/pages/delivery-information" },
      { label: "Exchange Policy", href: "/pages/exchange-policy" },
      { label: "Claim Policy", href: "/pages/claim-policy" },
      { label: "Contact", href: "/pages/contact" },
      { label: "FAQ", href: "/pages/faq" },
    ],
  },
  {
    title: "About",
    items: [
      { label: "About Us", href: "/pages/about" },
      { label: "Privacy Policy", href: "/pages/privacy-policy" },
      { label: "Terms & Conditions", href: "/pages/terms-and-conditions" },
    ],
  },
];

const SOCIAL = [
  { label: "Facebook", url: "https://facebook.com" },
  { label: "Instagram", url: "https://instagram.com" },
  { label: "YouTube", url: "https://youtube.com" },
];

/** Map the flat CMS footer menu nodes into a single "Customer Care" column. */
function cmsColumn(nodes: MenuNode[]): Column {
  return {
    title: "Customer Care",
    items: nodes.map((n) => ({
      label: n.label,
      href: resolveLink(n.link_type, n.link_ref),
      external: isExternalLink(n.link_type, n.link_ref),
    })),
  };
}

/**
 * Storefront footer (storefront-shell §5, §6, AC6). Renders link columns from
 * the CMS `menus.footer` when present, else the hard-coded BD policy fallback;
 * plus the newsletter stub, a social row (noopener), and the copyright line.
 * `role="contentinfo"` via the <footer>.
 */
export function Footer() {
  const { data } = useFooterMenus();
  const cmsFooter = data?.menus?.footer;
  const columns: Column[] =
    cmsFooter && cmsFooter.length > 0 ? [cmsColumn(cmsFooter)] : FALLBACK_COLUMNS;

  return (
    <footer role="contentinfo" className="mt-16 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand column — wordmark + tagline (placeholder asset, README §7) */}
        <div className="sm:col-span-2 lg:col-span-1">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-md bg-white text-[15px] font-black leading-none text-ink"
            >
              S<span className="text-volt-600">V</span>
            </span>
            <span className="text-[18px] font-extrabold uppercase tracking-tight text-white">
              Sports<span className="text-volt">Vault</span>
            </span>
          </span>
          <p className="mt-3 max-w-xs text-body-sm text-ink-500">
            Football &amp; cricket gear, delivered across Bangladesh.
          </p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-label font-semibold uppercase tracking-wide text-volt-600">
              {col.title}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {col.items.map((item) => (
                <li key={item.label}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words text-body-sm text-ink-500 transition-colors duration-micro ease-out hover:text-cyan-600 focus-visible:text-cyan-600"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="break-words text-body-sm text-ink-500 transition-colors duration-micro ease-out hover:text-cyan-600 focus-visible:text-cyan-600"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="text-label font-semibold uppercase tracking-wide text-volt-600">
            Stay in the loop
          </h2>
          <div className="mt-4">
            <NewsletterStub />
          </div>
        </div>
      </div>

      {/* Payment / courier marks (placeholders, README §7) */}
      <div className="border-t border-ink-700">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-5">
          <span className="text-label font-semibold uppercase tracking-wide text-ink-500">
            We accept
          </span>
          {["bKash", "Nagad", "COD", "Visa"].map((m) => (
            <span
              key={m}
              className="inline-flex h-7 items-center rounded-sm border border-ink-700 bg-ink-700 px-2.5 text-[12px] font-semibold text-white"
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      <div className="border-t border-ink-700">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-sm text-ink-500">
            © 2026 SportsVault. All rights reserved.
          </p>
          <ul className="flex gap-4">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-sm text-ink-500 transition-colors duration-micro ease-out hover:text-cyan-600 focus-visible:text-cyan-600"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
