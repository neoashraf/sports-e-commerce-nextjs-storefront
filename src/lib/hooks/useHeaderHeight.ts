"use client";

import { useEffect, useState } from "react";

/**
 * Measures the height of the sticky site header (`#site-header`) so sticky
 * page sections (e.g. the PLP subcategory + control bar) can pin themselves
 * directly beneath it. The header height varies by breakpoint and wraps on
 * mobile, so a hard-coded `top` offset is fragile — this tracks the real value
 * and re-measures on resize.
 *
 * Returns 0 during SSR / before the first measurement so the caller can fall
 * back to `top: 0` until hydration.
 */
export function useHeaderHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;

    const measure = () => setHeight(header.getBoundingClientRect().height);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(header);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return height;
}
