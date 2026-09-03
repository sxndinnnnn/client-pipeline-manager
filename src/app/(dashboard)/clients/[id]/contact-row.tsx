"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Contact } from "@/types/database";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7"
      />
    </svg>
  );
}

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

  return (
    <tr className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
      <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {contact.name}
      </td>
      <td className="px-4 py-3">
        {contact.role ? (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {contact.role}
          </span>
        ) : (
          <span className="text-sm text-zinc-400 dark:text-zinc-500">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
        {contact.email || "—"}
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
        {contact.phone || "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            aria-label="Edit contact"
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onClick={() => onDelete()}
            aria-label="Delete contact"
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
              const rect = dialogRef.current?.getBoundingClientRect();
              if (!rect) return;
              const outside =
                e.clientY < rect.top ||
                e.clientY > rect.bottom ||
                e.clientX < rect.left ||
                e.clientX > rect.right;
              if (outside) dialogRef.current?.close();
            }}
            className="m-auto max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-lg backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Edit Contact
              </h2>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close"
                className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
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
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Name *
                </label>
                <input
                  name="name"
                  defaultValue={contact.name}
                  required
                  className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Role
                </label>
                <input
                  name="role"
                  defaultValue={contact.role ?? ""}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={contact.email ?? ""}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Phone
                </label>
                <input
                  name="phone"
                  defaultValue={contact.phone ?? ""}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <button
                type="submit"
                className="mt-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Save Changes
              </button>
            </form>
          </dialog>,
          document.body
        )}
    </tr>
  );
}
