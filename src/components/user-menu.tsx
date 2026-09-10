"use client";

import { useEffect, useRef, useState } from "react";

function getInitials(email: string) {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "?";
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <circle cx="9" cy="7.8" r="3.3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.3 20.2a6.7 6.7 0 0 1 13.4 0" />
      <circle cx="17.3" cy="8.6" r="2.7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.6 12.9a5.3 5.3 0 0 1 6.1 5.2" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H9" />
    </svg>
  );
}

export function UserMenu({
  email,
  signOutAction,
}: {
  email: string;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-[34px] w-[34px] items-center justify-center rounded-md border border-zinc-300 text-[11px] font-bold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {getInitials(email)}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-md border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white dark:bg-blue-500">
              {getInitials(email)}
            </span>
            <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {email}
            </span>
          </div>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

          <div
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium text-zinc-400 dark:text-zinc-600"
          >
            <UsersIcon />
            Manage Users
            <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              Planned
            </span>
          </div>

          <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <LogOutIcon />
              Log Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
