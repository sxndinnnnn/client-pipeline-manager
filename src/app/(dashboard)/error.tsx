"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-sm font-medium text-error">Something went wrong.</p>
      <p className="max-w-md text-sm text-subtle">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-sunken"
      >
        Try again
      </button>
    </div>
  );
}
