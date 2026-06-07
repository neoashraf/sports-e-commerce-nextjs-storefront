import { create } from "zustand";
import { setPendingAction, clearPendingAction } from "@/lib/auth/pending-action";

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
  | "claim";

interface AuthUiState {
  open: boolean;
  view: AuthView;
  /** Email carried between login/register/reset for prefill continuity. */
  prefillEmail?: string;
  openAuth: (opts?: {
    view?: AuthView;
    resume?: () => void;
    prefillEmail?: string;
  }) => void;
  setView: (view: AuthView, prefillEmail?: string) => void;
  closeAuth: () => void;
}

export const useAuthUi = create<AuthUiState>((set) => ({
  open: false,
  view: "phone",
  prefillEmail: undefined,
  openAuth: (opts) => {
    setPendingAction(opts?.resume ?? null);
    set({
      open: true,
      view: opts?.view ?? "phone",
      prefillEmail: opts?.prefillEmail,
    });
  },
  setView: (view, prefillEmail) =>
    set((s) => ({ view, prefillEmail: prefillEmail ?? s.prefillEmail })),
  closeAuth: () => {
    clearPendingAction();
    set({ open: false });
  },
}));
