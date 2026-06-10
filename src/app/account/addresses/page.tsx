"use client";

import { useState } from "react";
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/lib/api/hooks/useAddresses";
import type { AddressDto } from "@/lib/api/schemas/auth";
import { AddressCard } from "@/components/account/addresses/AddressCard";
import { AddressForm } from "@/components/account/addresses/AddressForm";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/lib/stores/toast";

/**
 * Address book (address-book brief): list / add / edit / delete / set-default,
 * with loading, empty, and error states. Add/edit opens the form in a
 * bottom-sheet (mobile) / modal (desktop).
 */
export default function AddressesPage() {
  const { data: list, isLoading, isError, refetch } = useAddresses();
  const del = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AddressDto | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<AddressDto | undefined>();

  const openAdd = () => { setEditing(undefined); setFormOpen(true); };
  const openEdit = (a: AddressDto) => { setEditing(a); setFormOpen(true); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-h1 font-bold text-ink">Addresses</h1>
        <Button fullWidth={false} onClick={openAdd}>Add address</Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-surface-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-border p-6 text-center">
          <p className="text-body-sm text-text-muted">Couldn&apos;t load your addresses.</p>
          <Button fullWidth={false} className="mt-3" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {!isLoading && !isError && list && list.length === 0 && (
        <div className="rounded-lg border border-dashed border-border-strong p-8 text-center">
          <p className="text-body-sm text-text-muted">No saved addresses yet.</p>
          <Button fullWidth={false} className="mt-3" onClick={openAdd}>Add address</Button>
        </div>
      )}

      {!isLoading && list && list.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...list]
            .sort((a, b) => Number(b.is_default) - Number(a.is_default))
            .map((a) => (
              <AddressCard
                key={a.id}
                address={a}
                busy={del.isPending || setDefault.isPending}
                onEdit={() => openEdit(a)}
                onDelete={() => setConfirmDelete(a)}
                onSetDefault={() =>
                  setDefault.mutate({ id: a.id }, { onSuccess: () => toast("Default updated.") })
                }
              />
            ))}
        </div>
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit address" : "Add address"}
      >
        <AddressForm
          existing={editing}
          onDone={() => setFormOpen(false)}
          onCancel={() => setFormOpen(false)}
        />
      </Sheet>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete address"
        danger
        confirmLabel="Delete"
        pending={del.isPending}
        message="This address will be removed. If it's your default, another address becomes the default."
        onClose={() => setConfirmDelete(undefined)}
        onConfirm={() => {
          if (!confirmDelete) return;
          del.mutate(confirmDelete.id, {
            onSuccess: () => { toast("Address removed."); setConfirmDelete(undefined); },
            onError: () => toast("Couldn't remove the address.", "error"),
          });
        }}
      />
    </div>
  );
}
