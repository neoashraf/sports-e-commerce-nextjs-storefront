/**
 * Minimal server-side HTML sanitizer for CMS page bodies (cms-storefront-content-fe).
 * The repo ships no sanitizer library, so this is a conservative allowlist
 * pass: strip <script>/<style>, drop inline event handlers and `javascript:`
 * URLs, and remove any tag not on the allowlist (keeping its text). It runs on
 * the server (SSR) over BE-stored markup. Swap for a vetted library (e.g.
 * DOMPurify/sanitize-html) when one is added — flagged in the PR.
 */
const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "strong", "em", "b", "i", "u", "a",
  "blockquote", "code", "pre", "span", "div", "table", "thead",
  "tbody", "tr", "td", "th", "img",
]);

export function sanitizeHtml(input: string): string {
  let html = input;

  // Drop entire <script>/<style> blocks.
  html = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, "");

  // Remove inline event handlers (on*) and javascript: URLs.
  html = html.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1=$2#$2');

  // Strip any tag not on the allowlist, keeping inner text.
  html = html.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tag: string) => {
    return ALLOWED_TAGS.has(tag.toLowerCase()) ? match : "";
  });

  return html;
}
