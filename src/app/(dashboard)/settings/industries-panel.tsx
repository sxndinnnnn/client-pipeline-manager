"use client";

import { useRef, useState } from "react";
import type { Industry } from "@/types/database";
import { PencilIcon, TrashIcon, XIcon } from "@/components/icons";
import { createIndustry, deleteIndustry, renameIndustry } from "./industries-actions";
import { SubmitButton } from "@/components/submit-button";

function AddIndustryModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        + Add Industry
      </button>
      <dialog
        ref={dialogRef}
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 open:flex backdrop:bg-black/40"
      >
        <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-floating">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-foreground">Add Industry</h2>
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
              setError(null);
              const result = await createIndustry(formData);
              if (result.error) setError(result.error);
              else dialogRef.current?.close();
            }}
            className="mt-3 flex flex-col gap-3"
          >
            <div>
              <label className="block text-xs font-medium text-muted">Industry Name *</label>
              <input
                name="name"
                type="text"
                required
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
              />
            </div>
            {error && <p className="text-xs text-error">{error}</p>}
            <SubmitButton className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
              Create Industry
            </SubmitButton>
          </form>
        </div>
      </dialog>
    </>
  );
}

function IndustryRow({ industry }: { industry: Industry }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-sm font-medium text-foreground">{industry.name}</td>
      <td className="px-4 py-3">
        <div className="flex gap-3">
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
              const result = await deleteIndustry(industry.id);
            if (result.error) alert(result.error);
            }}
          >
            <button type="submit" aria-label="Delete industry" className="p-3.5 text-error hover:opacity-80 lg:p-0">
              <TrashIcon />
            </button>
          </form>
        </div>
      </td>

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
              setError(null);
              const result = await renameIndustry(industry.id, formData);
              if (result.error) setError(result.error);
              else dialogRef.current?.close();
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
            <SubmitButton className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">Save Changes</SubmitButton>
          </form>
        </div>
      </dialog>
    </tr>
  );
}

export function IndustriesPanel({ industries }: { industries: Industry[] }) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Industries</h2>
        <AddIndustryModal />
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Industry Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {industries.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-sm text-subtle">
                  No industries yet.
                </td>
              </tr>
            )}
            {industries.map((industry) => (
              <IndustryRow key={industry.id} industry={industry} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
