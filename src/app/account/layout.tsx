import type { Metadata } from "next";
import { AccountGuard } from "@/components/account/AccountGuard";
import { AccountNav } from "@/components/account/AccountNav";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

/**
 * My-Account section shell (account-home §3): auth-gated; desktop shows a
 * persistent left sub-nav alongside the content pane.
 */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccountGuard>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-8">
          <aside className="hidden lg:block">
            <AccountNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </AccountGuard>
  );
}
