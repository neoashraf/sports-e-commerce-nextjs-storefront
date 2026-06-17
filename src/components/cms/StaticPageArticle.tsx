import type { ReactNode } from "react";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

/**
 * Shared prose styling for storefront static/policy pages — aligned to the
 * cms.css type scale (16.5px/1.72 body in ink-700, volt-600 links + list
 * markers, surface-50 table header, callout/quote). `font-bangla` so Bangla
 * content wraps in Hind Siliguri, never clipped.
 * NOTE: the kit styles prose links cyan-600; this follows the lane's volt-600
 * CTA-accent directive — flagged for the design owner to confirm.
 */
export const STATIC_PAGE_PROSE =
  "font-bangla mt-6 max-w-none break-words text-[16.5px] leading-[1.72] text-ink-700 " +
  "[&_a]:font-medium [&_a]:text-volt-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-ink " +
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-volt-600 [&_blockquote]:pl-4 [&_blockquote]:text-ink-500 " +
  "[&_code]:rounded [&_code]:bg-surface-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[14px] " +
  "[&_h2]:mt-9 [&_h2]:scroll-mt-24 [&_h2]:text-[24px] [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:tracking-snug [&_h2]:text-ink " +
  "[&_h3]:mt-6 [&_h3]:scroll-mt-24 [&_h3]:text-[19px] [&_h3]:font-bold [&_h3]:text-ink " +
  "[&_hr]:my-8 [&_hr]:border-border " +
  "[&_li]:my-1.5 [&_li]:leading-[1.6] " +
  "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:marker:text-text-muted " +
  "[&_p]:my-3.5 " +
  "[&_strong]:font-semibold [&_strong]:text-ink " +
  "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[14.5px] " +
  "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 " +
  "[&_th]:border [&_th]:border-border [&_th]:bg-surface-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-ink " +
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-volt-600";

/**
 * The readable single-column shell shared by every storefront static/policy
 * page — the CMS `/pages/[slug]` render route and the interim static legal
 * pages (Terms, Privacy). Body is supplied either as sanitized HTML
 * (`bodyHtml`, for CMS content) or as trusted JSX (`children`, for the static
 * pages). Keeps both render paths visually identical so a later CMS swap is
 * seamless (static-page.md §4).
 */
export function StaticPageArticle({
  title,
  updatedAt,
  bodyHtml,
  children,
}: {
  title: string;
  updatedAt?: string | null;
  bodyHtml?: string;
  children?: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-[68ch] px-4 py-10 sm:px-6">
      {/* Title — large, balanced, Bangla-safe line-box */}
      <h1 className="text-[32px] font-extrabold leading-[1.15] tracking-tight text-ink [text-wrap:balance] sm:text-[42px]">
        {title}
      </h1>

      {/* Last updated — render only when a timestamp is supplied */}
      {updatedAt && (
        <p className="mt-3 flex items-center gap-1.5 border-b border-border pb-4 text-[13px] text-text-muted">
          <Icon name="calendar" size={14} />
          Last updated {formatDate(updatedAt)}
        </p>
      )}

      {bodyHtml !== undefined ? (
        // CMS body is sanitized server-side (lib/cms/sanitize) before injection.
        <div className={STATIC_PAGE_PROSE} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      ) : (
        <div className={STATIC_PAGE_PROSE}>{children}</div>
      )}
    </article>
  );
}
