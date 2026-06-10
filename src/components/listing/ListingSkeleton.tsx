/**
 * Initial-load skeleton grid (product-listing §6 loading-initial, AC7). Matches
 * the live grid's column count; grey image block + two shimmer text lines +
 * price bar per card.
 */
export function ListingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul
      role="list"
      aria-hidden="true"
      className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <div className="aspect-square animate-pulse rounded-md bg-surface-100" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded-sm bg-surface-100" />
          <div className="mt-1.5 h-4 w-3/4 animate-pulse rounded-sm bg-surface-100" />
          <div className="mt-1.5 h-4 w-1/4 animate-pulse rounded-sm bg-surface-100" />
        </li>
      ))}
    </ul>
  );
}
