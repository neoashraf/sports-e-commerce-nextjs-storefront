"use client";

/**
 * Quantity stepper (cart-page §7, cart-core-fe AC4). Min 1; − at 1 invokes
 * `onRemove`; max = min(per-line 10, live `available`). Labelled for the line
 * title. The qty value is announced politely.
 */
export function QuantityStepper({
  quantity,
  max,
  title,
  disabled,
  onChange,
  onRemove,
}: {
  quantity: number;
  max: number;
  title: string;
  disabled?: boolean;
  onChange: (q: number) => void;
  onRemove: () => void;
}) {
  const atMax = quantity >= max;
  return (
    <div className="inline-flex h-10 items-center rounded-md border border-border-strong" aria-label={`Quantity for ${title}`}>
      <button
        type="button"
        aria-label={quantity <= 1 ? `Remove ${title}` : "Decrease quantity"}
        disabled={disabled}
        onClick={() => (quantity <= 1 ? onRemove() : onChange(quantity - 1))}
        className="grid h-10 w-9 place-items-center text-lg text-ink transition-colors duration-micro ease-out hover:bg-surface-100 disabled:opacity-40"
      >
        −
      </button>
      <span aria-live="polite" className="w-8 text-center text-body-sm font-semibold text-ink">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || atMax}
        onClick={() => onChange(quantity + 1)}
        className="grid h-10 w-9 place-items-center text-lg text-ink transition-colors duration-micro ease-out hover:bg-surface-100 disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
