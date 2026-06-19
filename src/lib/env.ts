/**
 * Centralized, validated access to public environment variables.
 * Fails fast at import time if a required variable is missing, so a
 * misconfigured deploy surfaces immediately instead of as a runtime 404.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and set it.`,
    );
  }
  return value;
}

export const env = {
  /** Backend REST API base URL, including the /api/v1 prefix. */
  apiUrl: required("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL),
  /** Public base URL of this storefront, for canonical/SEO metadata. */
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
  /**
   * Cloudflare Turnstile site key for the Get Help form's CAPTCHA (FR-LEAD-006).
   * Optional: when unset the widget is skipped and the form submits without a token
   * (the backend bypasses verification when its captcha is disabled — dev path).
   */
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "",
  /**
   * Seller details shown on the invoice (ORD §5.9 / FR-ORD-073). Public, non-secret
   * display info — overridable per-deploy but defaulted so the invoice always renders.
   * The BIN defaults to the placeholder until the real seller BIN is configured.
   */
  invoiceSeller: {
    name: process.env.NEXT_PUBLIC_SELLER_NAME?.trim() || "SportsVault",
    address:
      process.env.NEXT_PUBLIC_SELLER_ADDRESS?.trim() ||
      "Level 4, Bashundhara City, Panthapath, Dhaka 1215, Bangladesh",
    phone: process.env.NEXT_PUBLIC_SELLER_PHONE?.trim() || "+880 1700-000000",
    email:
      process.env.NEXT_PUBLIC_SELLER_EMAIL?.trim() || "billing@sportsvault.com.bd",
    bin: process.env.NEXT_PUBLIC_SELLER_BIN?.trim() || "000000000-0000",
  },
} as const;
