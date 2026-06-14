import type { Metadata } from "next";
import { AccountGuard } from "@/components/account/AccountGuard";
import { AccountNav } from "@/components/account/AccountNav";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

/**
 * My-Account section shell (account-home §3): auth-gated. At ≥880px a persistent
 * left sub-nav sits beside the content pane; below 880px the nav collapses to a
 * horizontal segmented tab strip above the content (RW7 — never hidden).
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccountGuard>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Mobile (<880px): tab strip above content */}
        <div className="mb-5 min-[880px]:hidden">
          <AccountNav />
        </div>
        <div className="min-[880px]:grid min-[880px]:grid-cols-[200px_1fr] min-[880px]:gap-8">
          <aside className="hidden min-[880px]:block">
            <AccountNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </AccountGuard>
  );
}
