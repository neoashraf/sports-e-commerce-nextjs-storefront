/**
 * BD mobile phone helpers (FR-AUTH-005). The platform stores E.164
 * `+8801XXXXXXXXX`; the UI shows a fixed `+880` affix and a 10-digit national
 * number starting with `1`.
 */

/**
 * Normalize what a user types into the national part. Keeps digits only, drops a
 * pasted `880` country code, and caps at 11 digits — but **keeps the leading `0`**
 * Bangladeshis naturally type (`01XXXXXXXXX`). The old version stripped the `0` on
 * every keystroke, so the first `0` a user pressed vanished and the field felt dead
 * ("can't type the number"). The leading `0` is dropped later, in `toE164`.
 */
export function normalizeNationalDigits(input: string): string {
  let digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("880")) digits = digits.slice(3); // pasted +880 / 880
  return digits.slice(0, 11);
}

/**
 * A valid BD national mobile is `1XXXXXXXXX` (10 digits, starts 1, second digit
 * 3–9), with or without the leading `0` operators write — both `1712345678` and
 * `01712345678` are accepted.
 */
export function isValidBdNational(national: string): boolean {
  return /^0?1[3-9]\d{8}$/.test(national);
}

/** Compose the E.164 number the API expects (drops any leading `0` first). */
export function toE164(national: string): string {
  return `+880${national.replace(/^0/, "")}`;
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
