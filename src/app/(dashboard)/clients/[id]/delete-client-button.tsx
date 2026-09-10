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
        className="rounded-md border border-error/40 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10"
      >
        Delete Client
      </button>
    </form>
  );
}
