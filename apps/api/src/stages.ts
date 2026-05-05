import { ApplicationStage } from "@flowhire/db";

export const stageLabels: Record<ApplicationStage, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected"
};

export const stages = Object.keys(stageLabels) as ApplicationStage[];
