/**
 * BD mobile phone helpers (FR-AUTH-005). The platform stores E.164
 * `+8801XXXXXXXXX`; the UI shows a fixed `+880` affix and a 10-digit national
 * number starting with `1`.
 */

/** Strip spaces/dashes and a leading 0; keep digits only. */
export function normalizeNationalDigits(input: string): string {
  return input.replace(/[^\d]/g, "").replace(/^0+/, "").slice(0, 10);
}

/** A valid BD national mobile number is 10 digits starting `1` (e.g. 1712345678). */
export function isValidBdNational(national: string): boolean {
  return /^1[3-9]\d{8}$/.test(national);
}

/** Compose the E.164 number the API expects from the national part. */
export function toE164(national: string): string {
  return `+880${national}`;
}

/** Validate a full E.164 BD mobile. */
export function isValidBdE164(e164: string): boolean {
  return /^\+8801[3-9]\d{8}$/.test(e164);
}

/**
 * Mask an E.164 number for display, keeping `+880` and the last 3 digits:
 * `+8801712345678` → `+8801•••••678` (design spec §12).
 */
export function maskPhone(e164: string): string {
  const m = e164.match(/^(\+8801)(\d+)(\d{3})$/);
  if (!m) return e164;
  return `${m[1]}${"•".repeat(m[2].length)}${m[3]}`;
}
