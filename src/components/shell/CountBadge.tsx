"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Count badge for the cart/wishlist icons (storefront-shell §5, §9). Hidden at
 * 0; cart caps the displayed value at "9+". A single subtle pulse plays on
 * increment, suppressed under `prefers-reduced-motion` (handled by the
 * `motion-reduce:animate-none` utility).
 */
export function CountBadge({ count, cap }: { count: number; cap?: number }) {
  const [pulse, setPulse] = useState(false);
  const prev = useRef(count);

  useEffect(() => {
    if (count > prev.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 300);
      prev.current = count;
      return () => clearTimeout(t);
    }
    prev.current = count;
  }, [count]);

  if (count <= 0) return null;

  const label = cap && count > cap ? `${cap}+` : String(count);

  return (
    <span
      aria-hidden="true"
      className={
        "absolute -right-1.5 -top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-volt px-1 text-[11px] font-bold leading-[18px] text-ink " +
        (pulse ? "animate-pulse-once" : "")
      }
    >
      {label}
    </span>
  );
}
