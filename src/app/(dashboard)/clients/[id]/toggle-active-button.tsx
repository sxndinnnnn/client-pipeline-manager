"use client";

export function ToggleActiveButton({
  isActive,
  clientName,
  onToggle,
}: {
  isActive: boolean;
  clientName: string;
  onToggle: () => Promise<void>;
}) {
  return (
    <form
      action={onToggle}
      onSubmit={(e) => {
        if (isActive && !confirm(`Deactivate "${clientName}"?`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className={
          isActive
            ? "rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-sunken"
            : "rounded-md border border-success/40 px-3 py-1.5 text-sm font-medium text-success hover:bg-success/10"
        }
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>
    </form>
  );
}
