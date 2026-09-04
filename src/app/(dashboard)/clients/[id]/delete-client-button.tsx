"use client";

export function DeleteClientButton({
  clientName,
  onDelete,
}: {
  clientName: string;
  onDelete: () => Promise<void>;
}) {
  return (
    <form
      action={onDelete}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete "${clientName}"? This also deletes all of its contacts, deals, activity, and tasks. This can't be undone.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
      >
        Delete Client
      </button>
    </form>
  );
}
