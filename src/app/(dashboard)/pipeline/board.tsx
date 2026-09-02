"use client";

import { useState, useTransition } from "react";
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
      className={`cursor-grab rounded-md border border-zinc-200 bg-white p-3 shadow-sm active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <Link
        href={`/deals/${deal.id}`}
        onClick={(e) => e.stopPropagation()}
        className="text-sm font-medium text-zinc-900 hover:underline"
      >
        {deal.title}
      </Link>
      <p className="mt-1 text-xs text-zinc-500">{deal.clients?.name}</p>
      {deal.value != null && (
        <p className="mt-1 text-xs font-medium text-zinc-700">
          ${Number(deal.value).toLocaleString()}
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
      className={`flex w-72 shrink-0 flex-col rounded-lg border bg-zinc-100/60 p-3 ${
        isOver ? "border-zinc-400 bg-zinc-100" : "border-zinc-200"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">{stage.name}</h3>
        <span className="text-xs text-zinc-500">{deals.length}</span>
      </div>
      {total > 0 && (
        <p className="mb-2 text-xs text-zinc-500">${total.toLocaleString()}</p>
      )}
      <div className="flex flex-col gap-2">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
        {deals.length === 0 && (
          <p className="rounded-md border border-dashed border-zinc-300 p-3 text-center text-xs text-zinc-400">
            No deals
          </p>
        )}
      </div>
    </div>
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

    const previousStageId = deal.stage_id;
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage_id: newStageId } : d))
    );

    startTransition(async () => {
      try {
        await moveDeal(dealId, newStageId);
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
    </DndContext>
  );
}
