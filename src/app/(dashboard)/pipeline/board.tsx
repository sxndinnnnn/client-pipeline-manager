"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Deal, PipelineStage } from "@/types/database";
import { formatLKR } from "@/lib/currency";
import { LOSS_REASONS, formatLostReason } from "@/lib/loss-reasons";
import { moveDeal } from "./actions";

type DealWithClient = Deal & { clients: { name: string } | null };

function DealCard({ deal }: { deal: DealWithClient }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-md border border-border bg-surface p-3 shadow-resting transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-raised active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <Link
        href={`/deals/${deal.id}`}
        onClick={(e) => e.stopPropagation()}
        className="text-sm font-medium text-foreground hover:underline"
      >
        {deal.title}
      </Link>
      <p className="mt-1 text-xs text-subtle">{deal.clients?.name}</p>
      {deal.value != null && (
        <p className="mt-1 text-xs font-medium text-muted">
          {formatLKR(Number(deal.value))}
        </p>
      )}
    </div>
  );
}

function Column({
  stage,
  deals,
}: {
  stage: PipelineStage;
  deals: DealWithClient[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg border bg-surface-sunken/60 p-3 ${
        isOver ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
        <span className="text-xs text-subtle">{deals.length}</span>
      </div>
      {total > 0 && (
        <p className="mb-2 text-xs text-subtle">{formatLKR(total)}</p>
      )}
      <div className="flex flex-col gap-2">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
        {deals.length === 0 && (
          <p className="rounded-md border border-dashed border-border-strong p-3 text-center text-xs text-subtle">
            No Deals
          </p>
        )}
      </div>
    </div>
  );
}

function LostReasonDialog({
  open,
  dealTitle,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  dealTitle: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<string>(LOSS_REASONS[0]);
  const [note, setNote] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      onClick={(e) => {
        if (e.target === dialogRef.current) onCancel();
      }}
      className="fixed inset-0 m-0 hidden h-full max-h-none w-full max-w-none items-center justify-center bg-transparent p-4 open:flex backdrop:bg-black/40"
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-4 shadow-floating">
        <h2 className="text-sm font-semibold text-foreground">Why was this deal lost?</h2>
        {dealTitle && <p className="mt-1 text-xs text-subtle">{dealTitle}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm(formatLostReason(reason, note));
          }}
          className="mt-3 flex flex-col gap-3"
        >
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
          >
            {LOSS_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {reason === "Other" && (
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a short note (optional)"
              className="w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-foreground"
            />
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Mark As Lost
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export function PipelineBoard({
  stages,
  initialDeals,
}: {
  stages: PipelineStage[];
  initialDeals: DealWithClient[];
}) {
  const [deals, setDeals] = useState(initialDeals);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lostPrompt, setLostPrompt] = useState<{ dealId: string; stageId: string } | null>(null);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = String(active.id);
    const newStageId = String(over.id);
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === newStageId) return;

    // Dropping into a Lost stage asks why first; the move happens on confirm.
    const targetStage = stages.find((s) => s.id === newStageId);
    if (targetStage?.kind === "LOST") {
      setLostPrompt({ dealId, stageId: newStageId });
      return;
    }

    applyMove(dealId, newStageId);
  }

  function applyMove(dealId: string, newStageId: string, lostReason?: string) {
    const previousStageId = deals.find((d) => d.id === dealId)?.stage_id ?? null;
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage_id: newStageId } : d))
    );

    startTransition(async () => {
      try {
        await moveDeal(dealId, newStageId, lostReason);
      } catch {
        setDeals((prev) =>
          prev.map((d) => (d.id === dealId ? { ...d, stage_id: previousStageId } : d))
        );
      }
    });
  }

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <Column
            key={stage.id}
            stage={stage}
            deals={deals.filter((d) => d.stage_id === stage.id)}
          />
        ))}
      </div>
      <DragOverlay>{activeDeal ? <DealCard deal={activeDeal} /> : null}</DragOverlay>
      <LostReasonDialog
        key={lostPrompt ? `${lostPrompt.dealId}:${lostPrompt.stageId}` : "closed"}
        open={lostPrompt != null}
        dealTitle={deals.find((d) => d.id === lostPrompt?.dealId)?.title ?? ""}
        onCancel={() => setLostPrompt(null)}
        onConfirm={(reason) => {
          if (lostPrompt) applyMove(lostPrompt.dealId, lostPrompt.stageId, reason);
          setLostPrompt(null);
        }}
      />
    </DndContext>
  );
}
