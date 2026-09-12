"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/settings/plans", label: "Plans" },
  { href: "/settings/industries", label: "Industries" },
  { href: "/settings/stages", label: "Pipeline Stages" },
  { href: "/settings/users", label: "Users" },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-6 border-b border-border">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-subtle hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
