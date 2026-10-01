"use client";

import { useRef, useState } from "react";
import { formatDateTime } from "@/lib/datetime";
import { PencilIcon, TrashIcon, XIcon } from "@/components/icons";
import {
  addUser,
  removeUser,
  updateUser,
  type SettingsUser,
  type UserActionResult,
} from "./users-actions";
import { SubmitButton } from "@/components/submit-button";

const INPUT_CLASS =
  "mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground";
const LABEL_CLASS = "block text-xs font-medium text-muted";
const TH_CLASS =
  "px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle";

/** Shared dialog shell for the add and edit user forms. */
function UserDialog({
  dialogRef,
  title,
  children,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 open:flex backdrop:bg-black/40"
    >
      <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-floating">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            className="p-3.5 text-subtle hover:text-foreground lg:p-0"
          >
            <XIcon />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

function AddUserModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        + Add User
      </button>
      <UserDialog dialogRef={dialogRef} title="Add User">
        <form
          action={async (formData) => {
            setError(null);
            const result: UserActionResult = await addUser(formData);
            if (result.error) setError(result.error);
            else dialogRef.current?.close();
          }}
          className="mt-3 flex flex-col gap-3"
        >
          <div>
            <label className={LABEL_CLASS}>Name</label>
            <input name="name" className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Position</label>
            <input name="position" className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Email *</label>
            <input name="email" type="email" required className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Password *</label>
            <input
              name="password"
              type="text"
              required
              minLength={8}
              autoComplete="off"
              className={INPUT_CLASS}
            />
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
          <SubmitButton className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Create User
          </SubmitButton>
        </form>
      </UserDialog>
    </>
  );
}

function EditUserModal({ user }: { user: SettingsUser }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="Edit user"
        className="p-3.5 text-subtle hover:text-foreground lg:p-0"
      >
        <PencilIcon />
      </button>
      <UserDialog dialogRef={dialogRef} title="Edit User">
        <form
          action={async (formData) => {
            setError(null);
            const result: UserActionResult = await updateUser(user.id, formData);
            if (result.error) setError(result.error);
            else dialogRef.current?.close();
          }}
          className="mt-3 flex flex-col gap-3"
        >
          <div>
            <label className={LABEL_CLASS}>Name</label>
            <input name="name" defaultValue={user.name ?? ""} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Position</label>
            <input name="position" defaultValue={user.position ?? ""} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Email *</label>
            <input
              name="email"
              type="email"
              required
              defaultValue={user.email ?? ""}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>New Password</label>
            <input
              name="password"
              type="text"
              minLength={8}
              autoComplete="off"
              placeholder="Leave blank to keep the current password"
              className={INPUT_CLASS}
            />
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
          <SubmitButton className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            Save Changes
          </SubmitButton>
        </form>
      </UserDialog>
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
        <h2 className="text-lg font-semibold text-foreground">Users</h2>
        {!error && <AddUserModal />}
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
                <th className={TH_CLASS}>Name</th>
                <th className={TH_CLASS}>Position</th>
                <th className={TH_CLASS}>Email</th>
                <th className={TH_CLASS}>Joined</th>
                <th className={TH_CLASS}>Last Sign In</th>
                <th className={TH_CLASS}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-subtle">
                    No users yet.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {user.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{user.position ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-muted">{user.email ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {formatDateTime(user.created_at)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
                    {user.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <EditUserModal user={user} />
                      {user.id !== currentUserId && (
                        <form
                          action={async () => {
                            if (
                              !confirm(
                                `Remove ${user.email ?? "this user"}? They will no longer be able to sign in.`
                              )
                            ) {
                              return;
                            }
                            const result = await removeUser(user.id);
                            if (result.error) alert(result.error);
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
                    </div>
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
