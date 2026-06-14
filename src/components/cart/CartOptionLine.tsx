/**
 * Cart option-value line — renders a line's configurable-attribute option values
 * (e.g. "Color: Black · Size: 42"), label muted + value ink/semibold, dotted
 * separators. Shared by the cart page and the mini-cart (design kit CartOptionLine).
 */
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function CartOptionLine({ options }: { options: Record<string, string> }) {
  const entries = Object.entries(options);
  if (entries.length === 0) return null;
  return (
    <span className="block overflow-hidden text-ellipsis text-body-sm leading-normal text-text-muted">
      {entries.map(([label, value], i) => (
        <span key={label}>
          {i > 0 && <span className="opacity-50"> · </span>}
          {cap(label)}: <span className="font-semibold text-ink">{value}</span>
        </span>
      ))}
    </span>
  );
}
