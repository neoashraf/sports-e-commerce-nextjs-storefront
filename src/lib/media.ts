import { env } from "@/lib/env";

/** Origin the browser uses to reach the backend, derived from the API base URL (strips /api/v1). */
function apiOrigin(): string {
  try {
    return new URL(env.apiUrl).origin;
  } catch {
    return "";
  }
}

/**
 * Resolve a stored media URL so it loads from the same origin the app uses for the API.
 * Backend-served uploads live under `/uploads/**`; their stored absolute host comes from
 * PUBLIC_BASE_URL, which can differ from where the browser actually reaches the backend
 * (proxy / tunnel / local) — so we re-point only those to the API origin. Genuinely external
 * URLs (CDN images, video links) and data:/blob: previews pass through untouched.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  const idx = url.indexOf("/uploads/");
  if (idx >= 0) return `${apiOrigin()}${url.slice(idx)}`;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    return `${apiOrigin()}${url.startsWith("/") ? "" : "/"}${url}`;
  }
  return url;
}
