"use client";

import { useRef, useState } from "react";
import type { Industry } from "@/types/database";
import { PencilIcon, TrashIcon, XIcon } from "@/components/icons";
import { createIndustry, deleteIndustry, renameIndustry } from "./industries-actions";

function AddIndustryForm() {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        try {
          setError(null);
          await createIndustry(formData);
          formRef.current?.reset();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to add industry");
        }
      }}
      className="flex flex-wrap items-start gap-2"
    >
      <input
        name="name"
        required
        placeholder="New industry name"
        className="w-full max-w-xs rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
      />
      <button
        type="submit"
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        + Add Industry
      </button>
      {error && <p className="w-full text-xs text-error">{error}</p>}
    </form>
  );
}

function IndustryRow({ industry }: { industry: Industry }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="flex items-center gap-2.5 border-t border-border py-2.5 text-sm first:border-t-0">
      <span className="flex-1 text-foreground">{industry.name}</span>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="Rename industry"
        className="p-3.5 text-subtle hover:text-foreground lg:p-0"
      >
        <PencilIcon />
      </button>
      <form
        action={async () => {
          try {
            await deleteIndustry(industry.id, industry.name);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete industry");
          }
        }}
      >
        <button type="submit" aria-label="Delete industry" className="p-3.5 text-error hover:opacity-80 lg:p-0">
          <TrashIcon />
        </button>
      </form>

      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 open:flex backdrop:bg-black/40"
      >
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-4 shadow-floating">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground">Rename Industry</h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="p-3.5 text-subtle hover:text-foreground lg:p-0"
            >
              <XIcon />
            </button>
          </div>
          <form
            action={async (formData) => {
              try {
                setError(null);
                await renameIndustry(industry.id, formData);
                dialogRef.current?.close();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to rename industry");
              }
            }}
            className="mt-3 flex flex-col gap-3"
          >
            <input
              name="name"
              defaultValue={industry.name}
              required
              className="w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
            />
            {error && <p className="text-xs text-error">{error}</p>}
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Save Changes
            </button>
          </form>
        </div>
      </dialog>
    </li>
  );
}

export function IndustriesPanel({ industries }: { industries: Industry[] }) {
  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Industries</h2>
      </div>

      <div className="mt-3">
        <AddIndustryForm />
      </div>

      <ul className="mt-4 rounded-lg border border-border px-4">
        {industries.length === 0 && (
          <li className="py-8 text-center text-sm text-subtle">No industries yet.</li>
        )}
        {industries.map((industry) => (
          <IndustryRow key={industry.id} industry={industry} />
        ))}
      </ul>
    </section>
  );
}
