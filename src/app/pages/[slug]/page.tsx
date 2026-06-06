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
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{page.title}</h1>
      <div
        className="prose prose-sm mt-6 max-w-none break-words text-gray-700 [&_a]:text-brand-600 [&_a]:underline [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:my-1 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-5"
        // Body is sanitized server-side (lib/cms/sanitize) before injection.
        dangerouslySetInnerHTML={{ __html: safeBody }}
      />
    </article>
  );
}
