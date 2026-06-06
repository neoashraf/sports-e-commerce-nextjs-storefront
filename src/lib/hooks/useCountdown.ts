"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Seconds countdown for the OTP resend cooldown (FR-AUTH-022). Client-driven
 * display; the server stays authoritative (a premature resend returns 429).
 */
export function useCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback((seconds: number) => {
    setSecondsLeft(seconds);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    timer.current = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [secondsLeft]);

  const mmss = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;
  return { secondsLeft, mmss, start, isRunning: secondsLeft > 0 };
}
