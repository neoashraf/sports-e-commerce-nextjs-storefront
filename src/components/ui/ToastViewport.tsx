"use client";

import { useEffect } from "react";
import { useToastStore } from "@/lib/stores/toast";

/**
 * Renders queued toasts in an aria-live region (design specs: success/error in
 * aria-live). Each toast auto-dismisses; errors linger a little longer.
 */
export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          id={t.id}
          message={t.message}
          variant={t.variant}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
}

function ToastItem({
  id,
  message,
  variant,
  onDismiss,
}: {
  id: number;
  message: string;
  variant: "success" | "error" | "info";
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const ms = variant === "error" ? 6000 : 3500;
    const timer = setTimeout(() => onDismiss(id), ms);
    return () => clearTimeout(timer);
  }, [id, variant, onDismiss]);

  const tone =
    variant === "error"
      ? "bg-red-600"
      : variant === "info"
        ? "bg-gray-900"
        : "bg-green-600";

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`pointer-events-auto max-w-sm truncate rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${tone}`}
    >
      {message}
    </div>
  );
}
