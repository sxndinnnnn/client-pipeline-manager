"use client";

import { useRef, useState } from "react";
import type { PipelineStage, StageKind } from "@/types/database";
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, TrashIcon, XIcon } from "@/components/icons";
import { createStage, deleteStage, moveStage, updateStage } from "./stages-actions";

const KIND_LABELS: Record<StageKind, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  WON: "Won",
  LOST: "Lost",
};

function AddStageForm() {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        try {
          setError(null);
          await createStage(formData);
          formRef.current?.reset();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to add stage");
        }
      }}
      className="flex flex-wrap items-start gap-2"
    >
      <input
        name="name"
        required
        placeholder="New Pipeline Stage Name"
        className="w-full max-w-xs rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
      />
      <button
        type="submit"
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        + Add Stage
      </button>
      {error && <p className="w-full text-xs text-error">{error}</p>}
    </form>
  );
}

function StageRow({
  stage,
  isFirst,
  isLast,
}: {
  stage: PipelineStage;
  isFirst: boolean;
  isLast: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="flex items-center gap-2.5 border-t border-border py-2.5 text-sm first:border-t-0">
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => moveStage(stage.id, "up")}
          disabled={isFirst}
          aria-label="Move up"
          className="text-subtle hover:text-foreground disabled:opacity-30"
        >
          <ArrowUpIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => moveStage(stage.id, "down")}
          disabled={isLast}
          aria-label="Move down"
          className="text-subtle hover:text-foreground disabled:opacity-30"
        >
          <ArrowDownIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <span className="flex-1 text-foreground">{stage.name}</span>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label="Edit stage"
        className="p-3.5 text-subtle hover:text-foreground lg:p-0"
      >
        <PencilIcon />
      </button>
      <form
        action={async () => {
          try {
            await deleteStage(stage.id, stage.name);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete stage");
          }
        }}
      >
        <button type="submit" aria-label="Delete stage" className="p-3.5 text-error hover:opacity-80 lg:p-0">
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
            <h2 className="text-sm font-semibold text-foreground">Edit Stage</h2>
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
                await updateStage(stage.id, formData);
                dialogRef.current?.close();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to update stage");
              }
            }}
            className="mt-3 flex flex-col gap-3"
          >
            <div>
              <label className="block text-xs font-medium text-muted">Stage Name</label>
              <input
                name="name"
                defaultValue={stage.name}
                required
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">Status Type</label>
              <select
                name="kind"
                defaultValue={stage.kind}
                className="mt-1 w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
              >
                {(Object.keys(KIND_LABELS) as StageKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </div>
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

export function StagesPanel({ stages }: { stages: PipelineStage[] }) {
  const ordered = [...stages].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Pipeline Stages</h2>
      </div>

      <div className="mt-3">
        <AddStageForm />
      </div>

      <ul className="mt-4 rounded-lg border border-border px-4">
        {ordered.length === 0 && (
          <li className="py-8 text-center text-sm text-subtle">No stages yet.</li>
        )}
        {ordered.map((stage, i) => (
          <StageRow
            key={stage.id}
            stage={stage}
            isFirst={i === 0}
            isLast={i === ordered.length - 1}
          />
        ))}
      </ul>
    </section>
  );
}
