"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMe } from "@/lib/api/hooks/useMe";
import { useAuthStore } from "@/lib/stores/auth";
import { endSession } from "@/lib/auth/session";
import { toast } from "@/lib/stores/toast";
import { AccountStatusBanners } from "@/components/auth/StatusBanners";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

/**
 * Account home (account-home brief): greeting, status prompts, section tiles,
 * and logout. Counts / recent-order are best-effort link-throughs to ORD/WISH
 * (not yet built) — rendered as graceful placeholders per the spec.
 */
export default function AccountHomePage() {
  const router = useRouter();
  const { isError, refetch, isLoading } = useMe();
  const customer = useAuthStore((s) => s.customer);
  const [loggingOut, setLoggingOut] = useState(false);

  const name = customer?.full_name;
  const greeting = name && name.trim().length > 0
    ? `Hi, ${name.length > 24 ? `${name.slice(0, 24)}…` : name}`
    : "Hi there";

  const onLogout = async () => {
    setLoggingOut(true);
    await endSession();
    toast("Logged out.");
    router.replace("/");
  };

  if (isError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-gray-600">Couldn&apos;t load your account.</p>
        <Button fullWidth={false} onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">My Account</h1>
      {isLoading ? (
        <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
      ) : (
        <p className="text-lg text-gray-700">{greeting}</p>
      )}

      <AccountStatusBanners />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        {SECTION_TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex min-h-[88px] flex-col justify-center rounded-xl border border-gray-200 bg-white p-4 hover:border-brand-300 hover:bg-brand-50/40"
          >
            <span aria-hidden className="text-xl">{t.icon}</span>
            <span className="mt-1 text-sm font-medium text-gray-900">{t.label}</span>
          </Link>
        ))}
      </div>

      <RecentOrder />

      <div className="border-t border-gray-100 pt-4">
        <Button variant="secondary" fullWidth={false} pending={loggingOut} onClick={onLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
}

const SECTION_TILES = [
  { href: "/account/orders", label: "Orders", icon: "📦" },
  { href: "/account/addresses", label: "Addresses", icon: "📍" },
  { href: "/account/wishlist", label: "Wishlist", icon: "❤️" },
  { href: "/account/settings", label: "Settings", icon: "⚙️" },
];

/**
 * Recent-order snapshot. The ORD module isn't built yet, so this shows the
 * spec's empty state ("No orders yet — start shopping.") rather than fetching.
 */
function RecentOrder() {
  return (
    <section aria-label="Recent order" className="rounded-xl border border-dashed border-gray-300 p-5 text-center">
      <p className="text-sm text-gray-500">No orders yet — start shopping.</p>
      <Link href="/" className="mt-1 inline-block text-sm font-medium text-brand-700 hover:underline">
        Browse products
      </Link>
    </section>
  );
}
