"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMe } from "@/lib/api/hooks/useMe";
import { useAuthStore } from "@/lib/stores/auth";
import { endSession } from "@/lib/auth/session";
import { toast } from "@/lib/stores/toast";
import { AccountStatusBanners } from "@/components/auth/StatusBanners";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
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
        <p className="text-body-sm text-text-muted">Couldn&apos;t load your account.</p>
        <Button fullWidth={false} onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-bold text-ink">My Account</h1>
      {isLoading ? (
        <div className="h-6 w-40 animate-pulse rounded bg-surface-100" />
      ) : (
        <p className="break-words text-h3 text-ink">{greeting}</p>
      )}

      <AccountStatusBanners />

      {/* Hub tiles — kit `.ac2-tile`: ink icon-circle + label/sub block + top-right badge zone. */}
      <div className="grid grid-cols-2 gap-3.5">
        {SECTION_TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="relative flex min-h-[116px] flex-col gap-3 rounded-lg border border-border bg-white p-5 transition-shadow duration-micro ease-out hover:shadow-card focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span aria-hidden className="grid h-11 w-11 place-items-center rounded-full bg-ink">
              <Icon name={t.icon} size={20} color="var(--volt)" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-body font-bold text-ink">{t.label}</span>
              <span className="text-body-sm text-text-muted">{t.sub}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="border-t border-border pt-4">
        <Button variant="secondary" fullWidth={false} pending={loggingOut} onClick={onLogout}>
          Log out
        </Button>
      </div>
    </div>
  );
}

// Kit tile icons (Lucide) + sub-labels. The open-orders count is not on the existing
// useMe payload, so the badge zone stays omitted (flagged) — sub-text is generic.
const SECTION_TILES = [
  { href: "/account/orders", label: "Orders", icon: "package", sub: "Track & reorder" },
  { href: "/account/addresses", label: "Addresses", icon: "map-pin", sub: "Delivery details" },
  { href: "/wishlist", label: "Wishlist", icon: "heart", sub: "Saved items" },
  { href: "/account/settings", label: "Settings", icon: "settings", sub: "Profile & security" },
];

