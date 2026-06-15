import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchStaticPage } from "@/lib/cms/fetch-page";
import { sanitizeHtml } from "@/lib/cms/sanitize";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

/**
 * Static CMS page route — `/pages/<slug>` (cms-storefront-content-fe, FR-CMS-061).
 * Server-rendered for SEO: fetches the published page, renders the SANITIZED
 * body, and emits SEO meta from the page's `seo`. Draft/missing/deleted → 404.
 * The footer + lead-form policy links resolve here.
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await fetchStaticPage(params.slug);
  if (!page) return { title: "Page not found", robots: { index: false, follow: false } };
  return {
    title: page.seo?.title ?? page.title,
    description: page.seo?.description,
  };
}

export default async function StaticContentPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = await fetchStaticPage(params.slug);
  if (!page) notFound();

  const safeBody = sanitizeHtml(page.body);

  return (
    <article className="mx-auto max-w-[68ch] px-4 py-10 sm:px-6">
      {/* Title — kit .cms-title: large, balanced, Bangla-safe line-box */}
      <h1 className="text-[32px] font-extrabold leading-[1.15] tracking-tight text-ink [text-wrap:balance] sm:text-[42px]">
        {page.title}
      </h1>

      {/* Last updated — render only when the payload carries a timestamp (kit .cms-updated) */}
      {page.updated_at && (
        <p className="mt-3 flex items-center gap-1.5 border-b border-border pb-4 text-[13px] text-text-muted">
          <Icon name="calendar" size={14} aria-hidden="true" />
          Last updated {formatDate(page.updated_at)}
        </p>
      )}

      {/*
        Prose — aligned to the cms.css type scale (16.5px/1.72 body in ink-700,
        volt-600 links + list markers, surface-50 table header, callout/quote).
        font-bangla so Bangla content wraps in Hind Siliguri, never clipped.
        Body is sanitized server-side (lib/cms/sanitize) before injection.
        NOTE: the kit styles prose links cyan-600; this follows the lane's volt-600
        CTA-accent directive — flagged for the design owner to confirm.
      */}
      <div
        className="font-bangla mt-6 max-w-none break-words text-[16.5px] leading-[1.72] text-ink-700
          [&_a]:font-medium [&_a]:text-volt-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-ink
          [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-volt-600 [&_blockquote]:pl-4 [&_blockquote]:text-ink-500
          [&_code]:rounded [&_code]:bg-surface-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[14px]
          [&_h2]:mt-9 [&_h2]:scroll-mt-24 [&_h2]:text-[24px] [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:tracking-snug [&_h2]:text-ink
          [&_h3]:mt-6 [&_h3]:scroll-mt-24 [&_h3]:text-[19px] [&_h3]:font-bold [&_h3]:text-ink
          [&_hr]:my-8 [&_hr]:border-border
          [&_li]:my-1.5 [&_li]:leading-[1.6]
          [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:marker:text-text-muted
          [&_p]:my-3.5
          [&_strong]:font-semibold [&_strong]:text-ink
          [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[14.5px]
          [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2
          [&_th]:border [&_th]:border-border [&_th]:bg-surface-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-ink
          [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-volt-600"
        dangerouslySetInnerHTML={{ __html: safeBody }}
      />
    </article>
  );
}
