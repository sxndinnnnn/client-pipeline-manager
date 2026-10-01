"use client";

import { useRef, useState } from "react";
import type { SalesTarget } from "@/types/database";
import { formatLKR, formatUSD } from "@/lib/currency";
import { TrashIcon } from "@/components/icons";
import { deleteTarget, saveTarget } from "./targets-actions";
import { SubmitButton } from "@/components/submit-button";

function TargetForm({ defaultYear }: { defaultYear: number }) {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setError(null);
        const result = await saveTarget(formData);
        if (result.error) setError(result.error);
        else formRef.current?.reset();
      }}
      className="flex flex-col gap-1"
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="year"
          type="number"
          required
          min={2000}
          max={2100}
          defaultValue={defaultYear}
          aria-label="Year"
          className="w-24 rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
        />
        <input
          name="amount_lkr"
          type="number"
          required
          min={0}
          step="any"
          placeholder="Target Revenue (LKR)"
          aria-label="Target revenue in LKR"
          className="w-48 rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
        />
        <input
          name="amount_usd"
          type="number"
          required
          min={0}
          step="any"
          placeholder="Target Revenue (USD)"
          aria-label="Target revenue in USD"
          className="w-48 rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
        />
        <SubmitButton className="shrink-0 whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          + Add Target
        </SubmitButton>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </form>
  );
}

export function TargetsPanel({ targets }: { targets: SalesTarget[] }) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Targets</h2>
        <TargetForm defaultYear={new Date().getFullYear()} />
      </div>

      <ul className="mt-4 rounded-lg border border-border px-4">
        {targets.length === 0 && (
          <li className="py-8 text-center text-sm text-subtle">No targets yet.</li>
        )}
        {targets.map((t) => (
          <li
            key={t.year}
            className="flex items-center gap-3 border-t border-border py-2.5 text-sm first:border-t-0"
          >
            <span className="w-16 font-medium text-foreground">{t.year}</span>
            <span className="flex-1 text-muted">
              {formatLKR(Number(t.amount_lkr))}
              <span className="px-3 text-subtle">|</span>
              {t.amount_usd != null ? formatUSD(Number(t.amount_usd)) : "-"}
            </span>
            <form
              action={async () => {
                const result = await deleteTarget(t.year);
                if (result.error) alert(result.error);
              }}
            >
              <button
                type="submit"
                aria-label={`Delete ${t.year} target`}
                className="p-3.5 text-error hover:opacity-80 lg:p-0"
              >
                <TrashIcon />
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
