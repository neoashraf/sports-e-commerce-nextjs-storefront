import { ApiError } from "@/lib/api/errors";

/**
 * Per-reason copy for a rejected coupon. The backend answers `COUPON_INVALID` with a machine-readable
 * `reason` (api-contracts/04 §Cart, FR-PROMO-010) — every value the engine can return is spelled out
 * here, because a shopper told only "this code isn't valid" cannot tell whether to fix their cart,
 * wait for the start date, or give up on the code entirely.
 *
 * Shared by the coupon field (apply, 422) and the checkout place handler (re-validation, 409) so both
 * surfaces say the same thing.
 */
export const COUPON_REASON_COPY: Record<string, string> = {
  not_found: "We couldn't find that code — check the spelling.",
  inactive: "This code is no longer active.",
  not_started: "This code isn't active yet — check the start date.",
  expired: "This code has expired.",
  min_order_not_met: "Your cart hasn't reached this code's minimum order value.",
  usage_limit_reached: "This code has been fully claimed.",
  per_customer_limit_reached: "You've already used this code the maximum number of times.",
  not_eligible_items: "This code doesn't apply to the items in your cart.",
  first_order_only: "This code is for first orders only — your account has an earlier order.",
};

/**
 * Resolve the message to show for a coupon rejection: our per-reason copy first, then the server's
 * own wording, then a generic line. Pass any caught error — non-coupon errors get the fallback.
 */
export function couponErrorMessage(err: unknown, fallback = "This code isn’t valid."): string {
  if (!(err instanceof ApiError)) return fallback;
  if (err.reason && COUPON_REASON_COPY[err.reason]) return COUPON_REASON_COPY[err.reason];
  return err.message || fallback;
}
