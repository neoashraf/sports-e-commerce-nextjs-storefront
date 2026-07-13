import { create } from "zustand";
import { setPendingAction, clearPendingAction } from "@/lib/auth/pending-action";
import type { MfaChallengeDto, MfaChannel } from "@/lib/api/schemas/auth";

/**
 * Controls the global auth overlay (phone-OTP / email-login / email-register /
 * reset-request / claim). Any component can call `openAuth()` to start a flow,
 * optionally registering a `resume` callback to run after successful auth
 * (design spec §13.5).
 */

export type AuthView =
  | "phone"
  | "email-login"
  | "email-register"
  | "reset-request"
  | "claim"
  | "mfa";

interface AuthUiState {
  open: boolean;
  view: AuthView;
  /** Email carried between login/register/reset for prefill continuity. */
  prefillEmail?: string;
  /** Name to use for a new account WITHOUT asking again (e.g. taken from the checkout form). */
  prefillName?: string;
  /** National BD phone to prefill the phone step (e.g. taken from the checkout form). */
  prefillPhone?: string;
  /** Login second-factor state (set when POST /auth/login returns `mfa_required`). */
  mfaPreAuth?: string;
  mfaChallenge?: MfaChallengeDto;
  mfaChannels?: MfaChannel[];
  openAuth: (opts?: {
    view?: AuthView;
    resume?: () => void;
    prefillEmail?: string;
    prefillName?: string;
    prefillPhone?: string;
  }) => void;
  setView: (view: AuthView, prefillEmail?: string) => void;
  /** Enter the second-factor step with the challenge the login returned (FR-MFA-010). */
  startMfa: (payload: { preAuth: string; challenge: MfaChallengeDto; channels: MfaChannel[] }) => void;
  closeAuth: () => void;
}

export const useAuthUi = create<AuthUiState>((set) => ({
  open: false,
  view: "phone",
  prefillEmail: undefined,
  prefillName: undefined,
  prefillPhone: undefined,
  openAuth: (opts) => {
    setPendingAction(opts?.resume ?? null);
    set({
      open: true,
      view: opts?.view ?? "phone",
      prefillEmail: opts?.prefillEmail,
      // Cleared (undefined) on a plain open so a checkout prefill never leaks into a later login.
      prefillName: opts?.prefillName,
      prefillPhone: opts?.prefillPhone,
    });
  },
  setView: (view, prefillEmail) =>
    set((s) => ({ view, prefillEmail: prefillEmail ?? s.prefillEmail })),
  startMfa: ({ preAuth, challenge, channels }) =>
    set({ view: "mfa", mfaPreAuth: preAuth, mfaChallenge: challenge, mfaChannels: channels }),
  closeAuth: () => {
    clearPendingAction();
    set({ open: false, mfaPreAuth: undefined, mfaChallenge: undefined, mfaChannels: undefined });
  },
}));
