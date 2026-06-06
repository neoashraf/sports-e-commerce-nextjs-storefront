/**
 * Resolve a CMS link target (`link_type` + `link_ref`) to a storefront href.
 * Shared by the shell footer and the home hero/promo/tiles (cms-home-fe).
 *
 *  - category → /c/<slug> (PLP)
 *  - product  → /p/<slug> (PDP)
 *  - page     → /pages/<slug> (deferred CMS page route — placeholder target)
 *  - url      → the external URL verbatim (only https rendered by callers)
 */
export function resolveLink(
  linkType: string | undefined,
  linkRef: string | undefined,
): string {
  if (!linkRef) return "#";
  switch (linkType) {
    case "category":
      return `/c/${linkRef}`;
    case "product":
      return `/p/${linkRef}`;
    case "page":
      return `/pages/${linkRef}`;
    case "url":
      return linkRef;
    default:
      // Unknown/absent type — treat a bare http(s) ref as external, else a page.
      return /^https?:\/\//.test(linkRef) ? linkRef : `/pages/${linkRef}`;
  }
}

/** True when the link points at an external URL (→ target=_blank + noopener). */
export function isExternalLink(
  linkType: string | undefined,
  linkRef: string | undefined,
): boolean {
  if (linkType === "url") return true;
  return !!linkRef && /^https?:\/\//.test(linkRef);
}
