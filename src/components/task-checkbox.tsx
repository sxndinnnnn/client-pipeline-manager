"use client";

import { useState, useTransition } from "react";

export function TaskCheckbox({
  taskId,
  dealId,
  initialDone,
  onToggle,
}: {
  taskId: string;
  dealId: string;
  initialDone: boolean;
  onToggle: (dealId: string, taskId: string, done: boolean) => Promise<void>;
}) {
  const [done, setDone] = useState(initialDone);
  const [, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      checked={done}
      onChange={(e) => {
        const next = e.target.checked;
        setDone(next);
        startTransition(async () => {
          try {
            await onToggle(dealId, taskId, next);
          } catch {
            setDone(!next);
          }
        });
      }}
      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 dark:bg-zinc-900"
    />
  );
}
