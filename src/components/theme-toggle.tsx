"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";

export function ThemeToggle() {
  // null until mounted, so the server-rendered markup and the first client
  // render match exactly (theme is only known client-side, from localStorage).
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Reads the class the anti-flash script in the root layout already set
    // before hydration - there's no external event to subscribe to instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable (private mode etc.) - theme just won't persist
    }
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex h-[34px] w-[34px] items-center justify-center rounded-md border border-border-strong text-muted hover:bg-surface-sunken"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
