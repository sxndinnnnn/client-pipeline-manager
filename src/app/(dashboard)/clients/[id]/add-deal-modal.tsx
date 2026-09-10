"use client";

import { useRef } from "react";
import { XIcon } from "@/components/icons";

export function AddDealModal({
  createDealAction,
}: {
  createDealAction: (formData: FormData) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function open() {
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        + Add Deal
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 open:flex backdrop:bg-black/40"
      >
        <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-floating">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground">Add Deal</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="p-3.5 text-subtle hover:text-foreground lg:p-0"
            >
              <XIcon />
            </button>
          </div>

          <form
            action={async (formData) => {
              await createDealAction(formData);
              close();
            }}
            className="mt-3 flex flex-col gap-3"
          >
            <div>
              <label className="block text-xs font-medium text-muted">
                Deal Title *
              </label>
              <input
                name="title"
                required
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                Value (LKR)
              </label>
              <input
                name="value"
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                Source
              </label>
              <input
                name="source"
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                Expected Close Date
              </label>
              <input
                name="expected_close_date"
                type="date"
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
              />
            </div>
            <button
              type="submit"
              className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Create Deal
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
