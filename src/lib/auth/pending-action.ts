/**
 * "Resume the originating action" after auth (design spec §13.5 / phone-otp
 * AC5). When a guest triggers a gated action (add-to-wishlist, checkout), the
 * caller registers a callback here; on successful auth the AuthSheet runs it.
 *
 * Module-level (single in-flight intent) — there is only ever one auth sheet
 * open at a time, so one slot is sufficient.
 */

type PendingAction = () => void;

let pending: PendingAction | null = null;

export function setPendingAction(action: PendingAction | null) {
  pending = action;
}

export function consumePendingAction() {
  const action = pending;
  pending = null;
  action?.();
}

export function clearPendingAction() {
  pending = null;
}
