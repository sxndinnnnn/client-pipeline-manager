"use client";

import { useRef } from "react";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

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
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        + Add Deal
      </button>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none flex items-center justify-center bg-transparent p-4 backdrop:bg-black/40"
      >
        <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Add Deal</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
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
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Deal Title *
              </label>
              <input
                name="title"
                required
                className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Value (LKR)
              </label>
              <input
                name="value"
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Source
              </label>
              <input
                name="source"
                className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Expected Close Date
              </label>
              <input
                name="expected_close_date"
                type="date"
                className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <button
              type="submit"
              className="mt-1 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Create Deal
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
