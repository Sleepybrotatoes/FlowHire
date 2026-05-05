"use client";

import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { BriefcaseBusiness, CalendarDays, Mail, Plus, Search, Send, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import { CandidateApplication, PipelineStage, pipelineStages, StageId } from "@/lib/pipeline";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const stageAccent: Record<StageId, string> = {
  APPLIED: "bg-mint text-ink",
  SCREENING: "bg-saffron/35 text-ink",
  INTERVIEW: "bg-lavender/25 text-ink",
  OFFER: "bg-emerald-100 text-emerald-950",
  REJECTED: "bg-coral/20 text-rose-950"
};

export function PipelineBoard() {
  const [stages, setStages] = useState<PipelineStage[]>(pipelineStages);
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    let isMounted = true;

    async function loadApplications() {
      try {
        const response = await fetch(`${apiUrl}/applications`, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { stages: PipelineStage[] };
        if (isMounted) setStages(data.stages);
      } catch {
        // The scaffold remains usable with local sample data before the API is running.
      }
    }

    loadApplications();

    return () => {
      isMounted = false;
    };
  }, []);

  const applications = useMemo(
    () => stages.flatMap((stage) => stage.applications),
    [stages]
  );

  const activeApplication =
    applications.find((application) => application.id === activeApplicationId) ?? null;

  function moveApplication(applicationId: string, nextStageId: StageId) {
    setStages((currentStages) => {
      const movingApplication = currentStages
        .flatMap((stage) => stage.applications)
        .find((application) => application.id === applicationId);

      if (!movingApplication || movingApplication.stage === nextStageId) {
        return currentStages;
      }

      return currentStages.map((stage) => {
        if (stage.id === movingApplication.stage) {
          return {
            ...stage,
            applications: stage.applications.filter((application) => application.id !== applicationId)
          };
        }

        if (stage.id === nextStageId) {
          return {
            ...stage,
            applications: [{ ...movingApplication, stage: nextStageId }, ...stage.applications]
          };
        }

        return stage;
      });
    });
  }

  async function persistStage(applicationId: string, stage: StageId) {
    try {
      await fetch(`${apiUrl}/applications/${applicationId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage })
      });
    } catch {
      // Stage moves stay optimistic when the API is offline during early scaffolding.
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveApplicationId(null);

    const applicationId = String(event.active.id);
    const nextStageId = event.over?.id as StageId | undefined;

    if (!nextStageId) return;

    moveApplication(applicationId, nextStageId);
    persistStage(applicationId, nextStageId);
  }

  const totalApplications = applications.length;
  const interviews = stages.find((stage) => stage.id === "INTERVIEW")?.applications.length ?? 0;
  const offers = stages.find((stage) => stage.id === "OFFER")?.applications.length ?? 0;

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-[1560px] flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-ink/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded bg-ink text-white">
              <BriefcaseBusiness aria-hidden="true" size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-moss">FlowHire</p>
              <h1 className="text-2xl font-semibold tracking-normal text-ink">Product Designer pipeline</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-10 min-w-64 items-center gap-2 rounded border border-ink/10 bg-white px-3 shadow-sm">
              <Search aria-hidden="true" size={17} className="text-moss" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-moss/75"
                placeholder="Search candidates"
                type="search"
              />
            </div>
            <button className="grid h-10 w-10 place-items-center rounded border border-ink/10 bg-white text-ink shadow-sm" aria-label="Filter pipeline">
              <SlidersHorizontal aria-hidden="true" size={18} />
            </button>
            <button className="flex h-10 items-center gap-2 rounded bg-ink px-4 text-sm font-medium text-white shadow-sm">
              <Plus aria-hidden="true" size={18} />
              Candidate
            </button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Applications" value={totalApplications} tone="border-mint bg-white" />
          <Metric label="Interviews" value={interviews} tone="border-lavender/30 bg-white" />
          <Metric label="Offers" value={offers} tone="border-saffron/50 bg-white" />
        </section>

        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          onDragStart={(event) => setActiveApplicationId(String(event.active.id))}
          onDragCancel={() => setActiveApplicationId(null)}
          onDragEnd={onDragEnd}
        >
          <section className="grid min-h-[560px] gap-3 overflow-x-auto pb-3 lg:grid-cols-5">
            {stages.map((stage) => (
              <StageColumn key={stage.id} stage={stage} />
            ))}
          </section>

          <DragOverlay>
            {activeApplication ? <ApplicationCard application={activeApplication} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={clsx("rounded border px-4 py-3 shadow-sm", tone)}>
      <p className="text-xs font-semibold uppercase text-moss">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function StageColumn({ stage }: { stage: PipelineStage }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex min-w-[280px] flex-col gap-3 rounded border border-ink/10 bg-white/70 p-3 shadow-sm transition-colors",
        isOver && "border-ink/30 bg-mint/35"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={clsx("rounded px-2 py-1 text-xs font-semibold", stageAccent[stage.id])}>
            {stage.label}
          </span>
          <span className="text-sm font-medium text-moss">{stage.applications.length}</span>
        </div>
        <button className="grid h-8 w-8 place-items-center rounded text-moss hover:bg-ink/5" aria-label={`Add to ${stage.label}`}>
          <Plus aria-hidden="true" size={16} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {stage.applications.map((application) => (
          <ApplicationCard key={application.id} application={application} />
        ))}
      </div>
    </div>
  );
}

function ApplicationCard({
  application,
  isOverlay = false
}: {
  application: CandidateApplication;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id
  });

  const style = {
    transform: CSS.Translate.toString(transform)
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={clsx(
        "rounded border border-ink/10 bg-white p-3 shadow-sm outline-none transition hover:border-ink/25",
        isDragging && "opacity-40",
        isOverlay && "w-[280px] rotate-1 shadow-panel"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{application.candidate.name}</h2>
          <p className="mt-1 text-xs leading-5 text-moss">{application.candidate.headline}</p>
        </div>
        <span className="rounded bg-ink/5 px-2 py-1 text-[11px] font-medium text-moss">
          {application.source}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-ink/10 pt-3 text-xs text-moss">
        <span className="flex items-center gap-2">
          <BriefcaseBusiness aria-hidden="true" size={14} />
          {application.job.title}
        </span>
        <span className="flex items-center gap-2">
          <Mail aria-hidden="true" size={14} />
          {application.candidate.email}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-moss">
          <CalendarDays aria-hidden="true" size={14} />
          {application.stage === "INTERVIEW" ? "Interview pending" : "Updated today"}
        </span>
        <button className="grid h-8 w-8 place-items-center rounded bg-mint text-ink" aria-label="Send auto-response">
          <Send aria-hidden="true" size={15} />
        </button>
      </div>
    </article>
  );
}
