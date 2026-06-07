import { create } from "zustand";

/**
 * Minimal toast system. Success/info confirmations from auth flows
 * ("Logged in", "Verification email sent.", "Address saved."). Rendered by
 * <ToastViewport /> in an aria-live region.
 */

export interface Toast {
  id: number;
  message: string;
  variant: "success" | "error" | "info";
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, variant?: Toast["variant"]) => void;
  dismiss: (id: number) => void;
}

// Monotonic id without Date.now()/Math.random() (kept deterministic/SSR-safe).
let seq = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant = "success") => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper for non-component code. */
export function toast(message: string, variant: Toast["variant"] = "success") {
  useToastStore.getState().push(message, variant);
}
