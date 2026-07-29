/**
 * Typed API error mirroring the platform error envelope
 * (docs/srs/00-overview.md §7):
 *   { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
 *
 * Callers and React Query branch on `status` / `code`; forms map `fields`
 * back onto inputs via setError (see fe-form-builder).
 */

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];
  /** Seconds to wait before retrying, if the backend sent one (429/503). */
  readonly retryAfter?: number;
  /**
   * Machine-readable sub-reason some codes carry alongside `code` — e.g. COUPON_INVALID sends
   * `reason: "expired" | "usage_limit_reached" | "first_order_only" | …` (api-contracts/04 §Cart).
   * Callers map it to their own copy; `message` is the server's fallback wording.
   */
  readonly reason?: string;

  constructor(
    status: number,
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
    retryAfter?: number,
    reason?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
    this.reason = reason;
  }

  /** True for 4xx client errors — React Query should NOT retry these. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /** Field-level validation errors keyed by field name, for form mapping. */
  get fieldErrors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const d of this.details) {
      if (d.field) map[d.field] = d.message;
    }
    return map;
  }
}

/** Narrow an unknown caught value to ApiError. */
export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
