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
      <p className="text-sm font-medium text-red-600">Something went wrong.</p>
      <p className="max-w-md text-sm text-zinc-500">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
      >
        Try again
      </button>
    </div>
  );
}
