"use client";

import { useState, type ReactNode } from "react";

type Tab = {
  key: string;
  label: string;
  count?: number;
  content: ReactNode;
};

export function ClientTabs({ tabs, defaultTab }: { tabs: Tab[]; defaultTab?: string }) {
  const initial = tabs.some((t) => t.key === defaultTab) ? defaultTab : tabs[0]?.key;
  const [active, setActive] = useState(initial);

  return (
    <div>
      <div className="flex gap-6 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              active === tab.key
                ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="pt-6">{tabs.find((t) => t.key === active)?.content}</div>
    </div>
  );
}
