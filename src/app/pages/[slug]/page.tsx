import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchStaticPage } from "@/lib/cms/fetch-page";
import { sanitizeHtml } from "@/lib/cms/sanitize";
import { StaticPageArticle } from "@/components/cms/StaticPageArticle";

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
    <StaticPageArticle title={page.title} updatedAt={page.updated_at} bodyHtml={safeBody} />
  );
}
