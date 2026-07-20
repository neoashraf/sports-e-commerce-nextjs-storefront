import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Customer auth client state (global, low-frequency) — see fe-state-management.
 *
 * Holds the customer's tokens + identity for attaching the Bearer token to API
 * calls and gating account screens. The backend is the real authorization
 * boundary; this store only decides what UI to show and which token to send.
 * Tokens live in localStorage for now — note the XSS tradeoff
 * (fe-api-integration); migrate to httpOnly cookies if the threat model
 * requires it.
 *
 * The storefront is browseable without auth, so `customer` is null for guests.
 */

export interface Customer {
  id: string;
  /** Primary BD phone in E.164 (e.g. +8801XXXXXXXXX). May be null for email-only. */
  phone: string | null;
  /** Display name; null until collected (new phone → name sub-step). */
  full_name: string | null;
  email: string | null;
  /** Verification + account flags driving account-home/settings banners. */
  phone_verified?: boolean;
  email_verified?: boolean;
  /** Whether a password is set — drives the "finish your account" prompts (FR-AUTH-036/074). */
  has_password?: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  customer: Customer | null;
  tokens: AuthTokens | null;
  /** Gate localStorage reads until the client has hydrated (avoids SSR mismatch). */
  hydrated: boolean;
  setSession: (customer: Customer, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  setCustomer: (customer: Customer) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      customer: null,
      tokens: null,
      hydrated: false,
      setSession: (customer, tokens) => set({ customer, tokens }),
      setTokens: (tokens) => set({ tokens }),
      setCustomer: (customer) => set({ customer }),
      clear: () => set({ customer: null, tokens: null }),
    }),
    {
      name: "storefront-auth",
      partialize: (s) => ({ customer: s.customer, tokens: s.tokens }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/** Read the current access token outside React (for the API client). */
export function getAccessToken(): string | null {
  return useAuthStore.getState().tokens?.accessToken ?? null;
}

/** True if a customer is signed in (has tokens). */
export function isAuthenticated(): boolean {
  return useAuthStore.getState().tokens !== null;
}
