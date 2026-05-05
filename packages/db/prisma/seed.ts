import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { ApplicationStage, PrismaClient } from "@prisma/client";

loadEnv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "seed-org" },
    update: {},
    create: {
      id: "seed-org",
      name: "Acme Hiring"
    }
  });

  await prisma.user.upsert({
    where: { email: "recruiter@acme.test" },
    update: {},
    create: {
      email: "recruiter@acme.test",
      name: "Maya Recruiter",
      organizationId: org.id
    }
  });

  const job = await prisma.job.upsert({
    where: { id: "seed-job-product-designer" },
    update: {},
    create: {
      id: "seed-job-product-designer",
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      organizationId: org.id
    }
  });

  const candidates = [
    ["Avery Chen", "avery@example.com", "Portfolio-heavy UX generalist", ApplicationStage.APPLIED],
    ["Jordan Patel", "jordan@example.com", "Systems thinker with B2B SaaS background", ApplicationStage.SCREENING],
    ["Sam Rivera", "sam@example.com", "Strong prototyping and research practice", ApplicationStage.INTERVIEW],
    ["Taylor Brooks", "taylor@example.com", "Senior designer ready for team leadership", ApplicationStage.OFFER],
    ["Morgan Lee", "morgan@example.com", "Great person, not the right role match", ApplicationStage.REJECTED]
  ] as const;

  for (const [name, email, headline, stage] of candidates) {
    const candidate = await prisma.candidate.upsert({
      where: { organizationId_email: { organizationId: org.id, email } },
      update: { name, headline },
      create: { name, email, headline, organizationId: org.id }
    });

    await prisma.application.upsert({
      where: { candidateId_jobId: { candidateId: candidate.id, jobId: job.id } },
      update: { stage },
      create: {
        candidateId: candidate.id,
        jobId: job.id,
        organizationId: org.id,
        stage,
        source: "Seed data",
        autoResponseAt: stage === ApplicationStage.APPLIED ? new Date() : null
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
