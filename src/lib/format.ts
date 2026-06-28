/**
 * Display formatters. Money is stored/transferred as numbers and formatted
 * as BDT ৳ at render (fe-api-integration). Dates render DD/MM/YYYY per the
 * platform localization convention (docs/srs/00-overview.md §8).
 */

export function formatBDT(amount: number): string {
  return `৳ ${amount.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Human "wait" string for a 429 `retry_after` (seconds): sub-minute waits show as
 * seconds ("~5s") instead of rounding up to "~1 min", so a relaxed cooldown reads
 * honestly. Returns null when there's no retry hint (caller shows a generic message).
 */
export function formatRetryAfter(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  if (seconds < 60) return `~${seconds}s`;
  return `~${Math.ceil(seconds / 60)} min`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}
