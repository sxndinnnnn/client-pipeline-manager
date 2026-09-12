"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOutIcon, UsersIcon } from "@/components/icons";

function getInitials(email: string) {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "?";
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
        className="flex h-[34px] w-[34px] items-center justify-center rounded-md border border-border-strong text-[11px] font-bold text-muted hover:bg-surface-sunken"
      >
        {getInitials(email)}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-md border border-border bg-surface p-1.5 shadow-floating">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {getInitials(email)}
            </span>
            <span className="truncate text-sm font-medium text-foreground">
              {email}
            </span>
          </div>

          <div className="my-1 border-t border-border" />

          <Link
            href="/settings?tab=users"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-surface-sunken"
          >
            <UsersIcon />
            Manage Users
          </Link>

          <div className="my-1 border-t border-border" />

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm font-medium text-error hover:bg-error/10"
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
