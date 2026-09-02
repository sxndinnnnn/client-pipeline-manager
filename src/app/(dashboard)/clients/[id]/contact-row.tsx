"use client";

import { useState } from "react";
import type { Contact } from "@/types/database";

export function ContactRow({
  contact,
  onUpdate,
  onDelete,
}: {
  contact: Contact;
  onUpdate: (formData: FormData) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await onUpdate(formData);
          setEditing(false);
        }}
        className="grid grid-cols-2 gap-2 rounded-md border border-zinc-200 p-3 sm:grid-cols-4 dark:border-zinc-800"
      >
        <input
          name="name"
          defaultValue={contact.name}
          required
          placeholder="Name"
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <input
          name="role"
          defaultValue={contact.role ?? ""}
          placeholder="Role"
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <input
          name="email"
          defaultValue={contact.email ?? ""}
          placeholder="Email"
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <input
          name="phone"
          defaultValue={contact.phone ?? ""}
          placeholder="Phone"
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <div className="col-span-2 flex gap-2 sm:col-span-4">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {contact.name}
          {contact.role && (
            <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">{contact.role}</span>
          )}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {[contact.email, contact.phone].filter(Boolean).join(" · ") || "No contact details"}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete()}
          className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
