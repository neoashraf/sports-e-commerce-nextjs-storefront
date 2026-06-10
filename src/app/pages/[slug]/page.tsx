import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchStaticPage } from "@/lib/cms/fetch-page";
import { sanitizeHtml } from "@/lib/cms/sanitize";

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
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-display-lg font-extrabold tracking-tight text-ink">{page.title}</h1>
      <div
        className="mt-6 max-w-none break-words text-body text-ink-700 [&_a]:font-medium [&_a]:text-volt-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-4 [&_blockquote]:text-ink-500 [&_h2]:mt-8 [&_h2]:text-h2 [&_h2]:font-bold [&_h2]:tracking-snug [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:text-h3 [&_h3]:font-bold [&_h3]:text-ink [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_table]:border [&_table]:border-border [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_ul]:list-disc [&_ul]:pl-5"
        // Body is sanitized server-side (lib/cms/sanitize) before injection.
        dangerouslySetInnerHTML={{ __html: safeBody }}
      />
    </article>
  );
}
