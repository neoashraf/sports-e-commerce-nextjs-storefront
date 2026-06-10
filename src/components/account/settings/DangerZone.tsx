"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { me as meApi } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth";
import { toast } from "@/lib/stores/toast";
import { SettingsCard } from "./SettingsCard";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/**
 * Sessions + account deletion (profile-settings §5). "Log out of all devices"
 * (FR-AUTH-015) and a deliberate, checkbox-gated delete (FR-AUTH-080/081) that
 * explains order records are retained.
 */
export function DangerZone() {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const logoutAll = useMutation({
    mutationFn: () => meApi.logoutAll(),
    onSuccess: () => {
      clear();
      toast("Signed out of all devices.");
      router.replace("/");
    },
    onError: () => toast("Couldn't sign out everywhere.", "error"),
  });

  const deleteAccount = useMutation({
    mutationFn: () => meApi.deleteAccount(),
    onSuccess: () => {
      clear();
      router.replace("/");
      toast("Your account has been closed.");
    },
    onError: () => toast("Couldn't delete your account. Please try again.", "error"),
  });

  return (
    <>
      <SettingsCard id="sessions" title="Sessions">
        <p className="text-body-sm text-text-muted">Sign out everywhere if you suspect unauthorized access.</p>
        <Button variant="secondary" fullWidth={false} className="mt-3" onClick={() => setConfirmLogoutAll(true)}>
          Log out of all devices
        </Button>
      </SettingsCard>

      <section id="delete" aria-labelledby="delete-h" className="rounded-lg border border-error/30 bg-error/10 p-5">
        <h2 id="delete-h" className="text-h3 font-bold text-error">Delete account</h2>
        <p className="mt-2 text-body-sm text-text-muted">
          This will close your account and sign you out. Your past orders are kept for our records. This can&apos;t be undone.
        </p>
        <Button variant="danger" fullWidth={false} className="mt-3" onClick={() => setConfirmDelete(true)}>
          Delete my account
        </Button>
      </section>

      <ConfirmDialog
        open={confirmLogoutAll}
        title="Log out of all devices"
        confirmLabel="Log out everywhere"
        pending={logoutAll.isPending}
        message="You'll be signed out on every device, including this one."
        onClose={() => setConfirmLogoutAll(false)}
        onConfirm={() => logoutAll.mutate()}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete account"
        danger
        confirmLabel="Delete account"
        pending={deleteAccount.isPending}
        onClose={() => { setConfirmDelete(false); setAcknowledged(false); }}
        onConfirm={() => { if (acknowledged) deleteAccount.mutate(); }}
        message={
          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded-sm border-border-strong text-error focus:ring-2 focus:ring-error/30"
            />
            <span>I understand my account will be closed and this can&apos;t be undone. My past orders are retained for accounting.</span>
          </label>
        }
      />
    </>
  );
}
