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
import {
  BriefcaseBusiness,
  CalendarDays,
  Loader2,
  Mail,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  X
} from "lucide-react";
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

type JobSummary = {
  id: string;
  title: string;
  department: string;
  location: string;
};

type CandidateForm = {
  name: string;
  email: string;
  phone: string;
  headline: string;
  source: string;
  jobId: string;
  stage: StageId;
};

const emptyCandidateForm: CandidateForm = {
  name: "",
  email: "",
  phone: "",
  headline: "",
  source: "Manual entry",
  jobId: "",
  stage: "APPLIED"
};

export function PipelineBoard() {
  const [stages, setStages] = useState<PipelineStage[]>(pipelineStages);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [activeApplicationId, setActiveApplicationId] = useState<string | null>(null);
  const [isCandidateFormOpen, setIsCandidateFormOpen] = useState(false);
  const [candidateForm, setCandidateForm] = useState<CandidateForm>(emptyCandidateForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingCandidate, setIsSubmittingCandidate] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function loadApplications() {
    try {
      const response = await fetch(`${apiUrl}/applications`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { stages: PipelineStage[] };
      setStages(data.stages);
    } catch {
      // The scaffold remains usable with local sample data before the API is running.
    }
  }

  useEffect(() => {
    loadApplications();
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      const response = await fetch(`${apiUrl}/jobs`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as JobSummary[];
      setJobs(data);
      setCandidateForm((currentForm) => ({
        ...currentForm,
        jobId: currentForm.jobId || data[0]?.id || ""
      }));
    } catch {
      // The candidate form can still open; submission will surface API errors.
    }
  }

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

  function openCandidateForm(stage: StageId = "APPLIED") {
    setCandidateForm((currentForm) => ({
      ...emptyCandidateForm,
      jobId: currentForm.jobId || jobs[0]?.id || "",
      stage
    }));
    setFormError(null);
    setIsCandidateFormOpen(true);
  }

  async function submitCandidate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSubmittingCandidate(true);

    try {
      const response = await fetch(`${apiUrl}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidateForm)
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not add candidate");
      }

      setIsCandidateFormOpen(false);
      setCandidateForm((currentForm) => ({
        ...emptyCandidateForm,
        jobId: currentForm.jobId
      }));
      await loadApplications();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not add candidate");
    } finally {
      setIsSubmittingCandidate(false);
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
            <button
              className="flex h-10 items-center gap-2 rounded bg-ink px-4 text-sm font-medium text-white shadow-sm"
              onClick={() => openCandidateForm()}
              type="button"
            >
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
              <StageColumn key={stage.id} stage={stage} onAddCandidate={openCandidateForm} />
            ))}
          </section>

          <DragOverlay>
            {activeApplication ? <ApplicationCard application={activeApplication} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </section>

      {isCandidateFormOpen ? (
        <CandidateDialog
          form={candidateForm}
          formError={formError}
          isSubmitting={isSubmittingCandidate}
          jobs={jobs}
          onChange={setCandidateForm}
          onClose={() => setIsCandidateFormOpen(false)}
          onSubmit={submitCandidate}
        />
      ) : null}
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

function StageColumn({
  stage,
  onAddCandidate
}: {
  stage: PipelineStage;
  onAddCandidate: (stage: StageId) => void;
}) {
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
        <button
          className="grid h-8 w-8 place-items-center rounded text-moss hover:bg-ink/5"
          aria-label={`Add to ${stage.label}`}
          onClick={() => onAddCandidate(stage.id)}
          type="button"
        >
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
          <p className="mt-1 text-xs leading-5 text-moss">
            {application.candidate.headline || "Candidate profile"}
          </p>
        </div>
        <span className="rounded bg-ink/5 px-2 py-1 text-[11px] font-medium text-moss">
          {application.source || "Direct"}
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

function CandidateDialog({
  form,
  formError,
  isSubmitting,
  jobs,
  onChange,
  onClose,
  onSubmit
}: {
  form: CandidateForm;
  formError: string | null;
  isSubmitting: boolean;
  jobs: JobSummary[];
  onChange: React.Dispatch<React.SetStateAction<CandidateForm>>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  function updateField(field: keyof CandidateForm, value: string) {
    onChange((currentForm) => ({ ...currentForm, [field]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 px-4 py-6 backdrop-blur-sm">
      <form
        className="w-full max-w-xl rounded border border-ink/10 bg-white p-5 shadow-panel"
        onSubmit={onSubmit}
      >
        <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Add candidate</h2>
            <p className="mt-1 text-sm text-moss">Create a candidate and add them to the pipeline.</p>
          </div>
          <button
            aria-label="Close candidate form"
            className="grid h-9 w-9 place-items-center rounded text-moss hover:bg-ink/5"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Name
            <input
              className="h-10 rounded border border-ink/15 px-3 text-sm font-normal outline-none focus:border-ink"
              onChange={(event) => updateField("name", event.target.value)}
              required
              value={form.name}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Email
            <input
              className="h-10 rounded border border-ink/15 px-3 text-sm font-normal outline-none focus:border-ink"
              onChange={(event) => updateField("email", event.target.value)}
              required
              type="email"
              value={form.email}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Phone
            <input
              className="h-10 rounded border border-ink/15 px-3 text-sm font-normal outline-none focus:border-ink"
              onChange={(event) => updateField("phone", event.target.value)}
              value={form.phone}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Source
            <input
              className="h-10 rounded border border-ink/15 px-3 text-sm font-normal outline-none focus:border-ink"
              onChange={(event) => updateField("source", event.target.value)}
              value={form.source}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Job
            <select
              className="h-10 rounded border border-ink/15 bg-white px-3 text-sm font-normal outline-none focus:border-ink"
              disabled={jobs.length === 0}
              onChange={(event) => updateField("jobId", event.target.value)}
              required
              value={form.jobId}
            >
              {jobs.length === 0 ? <option value="">No jobs found</option> : null}
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Stage
            <select
              className="h-10 rounded border border-ink/15 bg-white px-3 text-sm font-normal outline-none focus:border-ink"
              onChange={(event) => updateField("stage", event.target.value)}
              required
              value={form.stage}
            >
              <option value="APPLIED">Applied</option>
              <option value="SCREENING">Screening</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-ink sm:col-span-2">
            Headline
            <textarea
              className="min-h-24 rounded border border-ink/15 px-3 py-2 text-sm font-normal outline-none focus:border-ink"
              onChange={(event) => updateField("headline", event.target.value)}
              value={form.headline}
            />
          </label>
        </div>

        {formError ? (
          <p className="mt-4 rounded border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-rose-950">
            {formError}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="h-10 rounded border border-ink/10 bg-white px-4 text-sm font-medium text-ink"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="flex h-10 min-w-32 items-center justify-center gap-2 rounded bg-ink px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || jobs.length === 0}
            type="submit"
          >
            {isSubmitting ? <Loader2 aria-hidden="true" className="animate-spin" size={16} /> : null}
            Add candidate
          </button>
        </div>
      </form>
    </div>
  );
}
