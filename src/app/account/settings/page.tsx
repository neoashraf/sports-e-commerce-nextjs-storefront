"use client";

import { useMe } from "@/lib/api/hooks/useMe";
import { Button } from "@/components/ui/Button";
import { ProfileGroup } from "@/components/account/settings/ProfileGroup";
import { EmailGroup } from "@/components/account/settings/EmailGroup";
import { PhoneGroup } from "@/components/account/settings/PhoneGroup";
import { PasswordGroup } from "@/components/account/settings/PasswordGroup";
import { TwoFactorGroup } from "@/components/account/settings/TwoFactorGroup";
import { CommsGroup } from "@/components/account/settings/CommsGroup";
import { DangerZone } from "@/components/account/settings/DangerZone";

/**
 * Settings (profile-settings brief): grouped, read-first setting cards —
 * Profile, Email, Phone, Password, Communication, Sessions, Delete. Each group
 * owns its own view→edit + save behavior.
 */
export default function SettingsPage() {
  const { data: profile, isLoading, isError, refetch } = useMe();

  return (
    <div className="space-y-5">
      <h1 className="text-h1 font-bold text-ink">Settings</h1>

      {isLoading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-surface-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-border p-6 text-center">
          <p className="text-body-sm text-text-muted">Couldn&apos;t load your settings.</p>
          <Button fullWidth={false} className="mt-3" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {profile && (
        <div className="space-y-4">
          <ProfileGroup profile={profile} />
          <EmailGroup profile={profile} />
          <PhoneGroup profile={profile} />
          <PasswordGroup profile={profile} />
          <TwoFactorGroup />
          <CommsGroup profile={profile} />
          <DangerZone />
        </div>
      )}
    </div>
  );
}
