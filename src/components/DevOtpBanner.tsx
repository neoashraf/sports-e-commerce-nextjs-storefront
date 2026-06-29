"use client";

import { useState } from "react";
import { useDevOtp } from "@/lib/stores/dev-otp";

/**
 * DEV-ONLY banner pinned to the top of the page that shows the **last** OTP the backend echoed
 * (`OTP_DEV_RETURN`) while there's no live SMS gateway — copy it into the verification step.
 * Renders nothing in production (the backend never sends `dev_otp` when `NODE_ENV=production`),
 * and nothing until the first OTP request. Only ever the latest code; a new request replaces it.
 */
export function DevOtpBanner() {
  const code = useDevOtp((s) => s.code);
  const phone = useDevOtp((s) => s.phone);
  const clear = useDevOtp((s) => s.clear);
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked (insecure origin) — the code is shown, so manual copy still works.
    }
  };

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-center text-[13px] font-medium text-amber-950 shadow-md"
    >
      <span className="font-semibold uppercase tracking-wide">Dev OTP</span>
      {phone && <span className="hidden sm:inline text-amber-900/80">for {phone}</span>}
      <code className="rounded bg-amber-950/10 px-2 py-0.5 text-[15px] font-bold tracking-[0.3em] tabular-nums">
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        className="rounded border border-amber-950/30 px-2 py-0.5 text-[12px] font-semibold hover:bg-amber-950/10"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={clear}
        aria-label="Dismiss dev OTP"
        className="ml-1 rounded px-1.5 py-0.5 text-[14px] leading-none hover:bg-amber-950/10"
      >
        ×
      </button>
    </div>
  );
}
