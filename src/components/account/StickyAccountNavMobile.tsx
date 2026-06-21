"use client";

import { AccountNav } from "./AccountNav";
import { useHeaderHeight } from "@/lib/hooks/useHeaderHeight";

/**
 * Mobile (<880px) account tab strip, pinned directly beneath the sticky site
 * header on scroll. The header height varies by breakpoint (mobile has an extra
 * search row), so the `top` offset is measured live via `useHeaderHeight` —
 * matching the PLP control-bar pattern (ProductListing) — instead of a fragile
 * hard-coded value. Falls back to `top: 0` until the first measurement.
 *
 * The negative inline margins + matching padding let the strip's blurred
 * backdrop bleed to the page gutters while the tabs stay aligned with content.
 */
export function StickyAccountNavMobile() {
  const headerH = useHeaderHeight();

  return (
    <div
      className="sticky z-30 -mx-4 mb-5 bg-white/90 px-4 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6 min-[880px]:hidden"
      style={{ top: headerH }}
    >
      <AccountNav />
    </div>
  );
}
