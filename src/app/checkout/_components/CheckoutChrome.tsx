import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Reduced checkout chrome — faithful port of the design kit header (ui_kits/
 * checkout). Slim bar: "Secure checkout" (lock) on the left, "Back to cart"
 * (chevron) on the right; surface-50 canvas with a 1120px content container.
 */
export function CheckoutChrome({ children }: { children: React.ReactNode }) {
  return (
    // Bottom padding clears the mobile sticky bar (<880px); removed once the bar hides.
    <div className="min-h-screen bg-surface-50 pb-28 min-[880px]:pb-0">
      {/* Slim sticky header (kit .co-header): 60px, white, bordered */}
      <header className="sticky top-0 z-30 border-b border-border bg-white">
        <div className="mx-auto flex h-[60px] max-w-[1120px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-body-sm font-semibold text-ink">
            <Icon name="lock" size={15} color="var(--volt-600)" aria-hidden="true" /> Secure checkout
          </span>
          <Link href="/cart" className="inline-flex items-center gap-1 text-body-sm font-semibold text-text-muted hover:text-ink">
            <Icon name="chevron-left" size={16} aria-hidden="true" /> Back to cart
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
