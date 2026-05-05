import cors from "cors";
import express from "express";
import { z } from "zod";
import { ApplicationStage, prisma } from "@flowhire/db";
import { config } from "./config.js";
import { stageLabels, stages } from "./stages.js";

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "flowhire-api" });
});

app.get("/stages", (_request, response) => {
  response.json(stages.map((id) => ({ id, label: stageLabels[id] })));
});

app.get("/jobs", async (_request, response, next) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    response.json(jobs);
  } catch (error) {
    next(error);
  }
});

app.get("/candidates", async (_request, response, next) => {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: { createdAt: "desc" }
    });

    response.json(candidates);
  } catch (error) {
    next(error);
  }
});

app.get("/applications", async (_request, response, next) => {
  try {
    const applications = await prisma.application.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        candidate: true,
        job: true,
        interviews: {
          orderBy: { startsAt: "asc" }
        }
      }
    });

    response.json({
      stages: stages.map((stage) => ({
        id: stage,
        label: stageLabels[stage],
        applications: applications.filter((application) => application.stage === stage)
      }))
    });
  } catch (error) {
    next(error);
  }
});

const createApplicationSchema = z.object({
  organizationId: z.string(),
  candidateId: z.string(),
  jobId: z.string(),
  source: z.string().optional()
});

app.post("/applications", async (request, response, next) => {
  try {
    const input = createApplicationSchema.parse(request.body);
    const application = await prisma.application.create({
      data: {
        ...input,
        stage: ApplicationStage.APPLIED,
        autoResponseAt: new Date()
      },
      include: { candidate: true, job: true }
    });

    response.status(201).json(application);
  } catch (error) {
    next(error);
  }
});

const updateApplicationStageSchema = z.object({
  stage: z.nativeEnum(ApplicationStage)
});

app.patch("/applications/:id/stage", async (request, response, next) => {
  try {
    const input = updateApplicationStageSchema.parse(request.body);
    const application = await prisma.application.update({
      where: { id: request.params.id },
      data: { stage: input.stage },
      include: { candidate: true, job: true }
    });

    response.json(application);
  } catch (error) {
    next(error);
  }
});

app.post("/applications/:id/auto-response", async (request, response, next) => {
  try {
    const application = await prisma.application.update({
      where: { id: request.params.id },
      data: { autoResponseAt: new Date() },
      include: { candidate: true, job: true }
    });

    response.json({
      application,
      message: `Auto-response queued for ${application.candidate.email}`
    });
  } catch (error) {
    next(error);
  }
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction
  ) => {
    if (error instanceof z.ZodError) {
      response.status(400).json({ error: "Validation failed", issues: error.issues });
      return;
    }

    console.error(error);
    response.status(500).json({ error: "Internal server error" });
  }
);

app.listen(config.port, () => {
  console.log(`FlowHire API listening on http://localhost:${config.port}`);
});
