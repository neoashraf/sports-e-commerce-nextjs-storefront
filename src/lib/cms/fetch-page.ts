import { env } from "@/lib/env";
import { staticPageSchema, type StaticPage } from "@/lib/api/schemas/content";

/**
 * Server-side fetch for a published CMS page (cms-storefront-content-fe). Used
 * by the SSR `/pages/[slug]` route for SEO — bypasses the client React Query
 * hook (which reads the browser auth store). Returns null on 404 / draft /
 * missing so the route can render `notFound()`.
 */
export async function fetchStaticPage(slug: string): Promise<StaticPage | null> {
  const base = env.apiUrl.replace(/\/$/, "");
  let res: Response;
  try {
    res = await fetch(`${base}/content/pages/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
      // Pages change rarely; allow ISR-style caching with a short revalidate.
      next: { revalidate: 300 },
    });
  } catch {
    return null;
  }
  if (res.status === 404) return null;
  if (!res.ok) return null;

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    return null;
  }
  // Unwrap the { data } envelope.
  const data = (payload as { data?: unknown })?.data ?? payload;
  const parsed = staticPageSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}
