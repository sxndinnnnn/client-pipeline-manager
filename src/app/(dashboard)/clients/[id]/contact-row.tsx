"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Contact } from "@/types/database";
import { PencilIcon, TrashIcon, XIcon } from "@/components/icons";

export function ContactRow({
  contact,
  onUpdate,
  onDelete,
}: {
  contact: Contact;
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Portal target (document.body) only exists client-side; this mirrors
    // the mount-detection pattern used by ThemeToggle for the same reason.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    // Defensive: this row is keyed by contact.id, so if the browser/router
    // reuses this component instance across a navigation (back/forward
    // cache, router cache) instead of a fresh mount, force the dialog
    // closed rather than trust inherited `open` state.
    if (mounted) {
      dialogRef.current?.close();
    }
  }, [mounted]);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        {contact.name}
      </td>
      <td className="px-4 py-3">
        {contact.role ? (
          <span className="rounded-full bg-border px-2 py-0.5 text-xs font-medium text-muted">
            {contact.role}
          </span>
        ) : (
          <span className="text-sm text-subtle">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-muted">
        {contact.email || "-"}
      </td>
      <td className="px-4 py-3 text-sm text-muted">
        {contact.phone || "-"}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            aria-label="Edit contact"
            className="p-3.5 text-subtle hover:text-foreground lg:p-0"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onClick={() => onDelete()}
            aria-label="Delete contact"
            className="p-3.5 text-error hover:opacity-80 lg:p-0"
          >
            <TrashIcon />
          </button>
        </div>
      </td>

      {mounted &&
        createPortal(
          <dialog
            ref={dialogRef}
            onClick={(e) => {
              if (e.target === dialogRef.current) dialogRef.current?.close();
            }}
            className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 open:flex backdrop:bg-black/40"
          >
            <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-floating">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Edit Contact
                </h2>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  aria-label="Close"
                  className="p-3.5 text-subtle hover:text-foreground lg:p-0"
                >
                  <XIcon />
                </button>
              </div>
              <form
                action={async (formData) => {
                  await onUpdate(formData);
                  dialogRef.current?.close();
                }}
                className="mt-3 flex flex-col gap-3"
              >
                <div>
                  <label className="block text-xs font-medium text-muted">
                    Name *
                  </label>
                  <input
                    name="name"
                    defaultValue={contact.name}
                    required
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">
                    Role
                  </label>
                  <input
                    name="role"
                    defaultValue={contact.role ?? ""}
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={contact.email ?? ""}
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted">
                    Phone
                  </label>
                  <input
                    name="phone"
                    defaultValue={contact.phone ?? ""}
                    className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </dialog>,
          document.body
        )}
    </tr>
  );
}
