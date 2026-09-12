"use client";

import { useRef, useState } from "react";
import { formatDateTime } from "@/lib/datetime";
import { TrashIcon, XIcon } from "@/components/icons";
import { inviteUser, removeUser, type SettingsUser } from "./users-actions";

function InviteUserModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        + Invite User
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 open:flex backdrop:bg-black/40"
      >
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-4 shadow-floating">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground">Invite User</h2>
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
              try {
                setError(null);
                await inviteUser(formData);
                dialogRef.current?.close();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to invite user");
              }
            }}
            className="mt-3 flex flex-col gap-3"
          >
            <div>
              <label className="block text-xs font-medium text-muted">Email *</label>
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
              />
            </div>
            <p className="text-xs text-subtle">
              Sends an email invite with a link to set a password and sign in.
            </p>
            {error && <p className="text-xs text-error">{error}</p>}
            <button
              type="submit"
              className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Send Invite
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}

export function UsersPanel({
  users,
  error,
  currentUserId,
}: {
  users: SettingsUser[];
  error?: string;
  currentUserId?: string;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Users</h2>
          <p className="text-sm text-subtle">Who can sign in to Pipeline Manager.</p>
        </div>
        {!error && <InviteUserModal />}
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-dashed border-border-strong bg-surface p-6 text-sm text-subtle">
          {error}
        </div>
      )}

      {!error && (
        <div className="mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface-sunken">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Joined
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Last Sign In
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-subtle">
                    No users yet.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {user.email ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {formatDateTime(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    {user.id === currentUserId ? (
                      <span className="text-xs text-subtle">You</span>
                    ) : (
                      <form
                        action={async () => {
                          if (
                            !confirm(
                              `Remove ${user.email ?? "this user"}? They will no longer be able to sign in.`
                            )
                          ) {
                            return;
                          }
                          try {
                            await removeUser(user.id, user.email ?? "unknown");
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "Failed to remove user");
                          }
                        }}
                      >
                        <button
                          type="submit"
                          aria-label="Remove user"
                          className="p-3.5 text-error hover:opacity-80 lg:p-0"
                        >
                          <TrashIcon />
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
