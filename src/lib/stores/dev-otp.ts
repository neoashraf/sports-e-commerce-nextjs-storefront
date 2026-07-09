import { create } from "zustand";

/**
 * Holds the most recent DEV-ONLY OTP echoed by the backend (`OTP_DEV_RETURN`), so the
 * {@link DevOtpBanner} can show it at the top of the page while there's no live SMS gateway.
 * Only ever the LAST code — each new OTP request replaces it. Never populated in production
 * (the backend hard-disables the echo when `NODE_ENV=production`).
 */
interface DevOtpState {
  code: string | null;
  /** Phone the code was sent to (for context in the banner). */
  phone: string | null;
  show: (code: string, phone?: string) => void;
  clear: () => void;
}

export const useDevOtp = create<DevOtpState>((set) => ({
  code: null,
  phone: null,
  show: (code, phone) => set({ code, phone: phone ?? null }),
  clear: () => set({ code: null, phone: null }),
}));
