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
        className="grid grid-cols-2 gap-2 rounded-md border border-zinc-200 p-3 sm:grid-cols-4"
      >
        <input
          name="name"
          defaultValue={contact.name}
          required
          placeholder="Name"
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
        <input
          name="role"
          defaultValue={contact.role ?? ""}
          placeholder="Role"
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
        <input
          name="email"
          defaultValue={contact.email ?? ""}
          placeholder="Email"
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
        <input
          name="phone"
          defaultValue={contact.phone ?? ""}
          placeholder="Phone"
          className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
        />
        <div className="col-span-2 flex gap-2 sm:col-span-4">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-200 p-3">
      <div>
        <p className="text-sm font-medium text-zinc-900">
          {contact.name}
          {contact.role && <span className="ml-2 text-xs text-zinc-500">{contact.role}</span>}
        </p>
        <p className="text-xs text-zinc-500">
          {[contact.email, contact.phone].filter(Boolean).join(" · ") || "No contact details"}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete()}
          className="text-xs font-medium text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
