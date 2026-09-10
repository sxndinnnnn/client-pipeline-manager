"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon, XIcon } from "@/components/icons";

export function MobileNav({
  links,
  userEmail,
  signOutAction,
}: {
  links: { href: string; label: string }[];
  userEmail?: string | null;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-border-strong text-muted hover:bg-surface-sunken"
      >
        {open ? <XIcon className="h-5 w-5" /> : <MenuIcon />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-border bg-surface px-4 py-3 shadow-floating">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-sunken"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-3">
            {userEmail && (
              <span className="truncate text-xs text-subtle">
                {userEmail}
              </span>
            )}
            <form action={signOutAction} className="ml-auto">
              <button
                type="submit"
                className="rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-sunken"
              >
                Log Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
