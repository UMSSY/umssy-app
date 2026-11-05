import type { JobMatch, RecommendedJob } from "../types/job-matching.types";

export function buildJob(overrides: Partial<RecommendedJob> = {}): RecommendedJob {
  return {
    jobOfferId: "o1",
    title: "Desarrollador Backend",
    companyName: "Empresa SA",
    modality: "Remoto",
    score: 67,
    matchedSkills: ["Python", "Docker"],
    skills: ["Python", "Docker", "React"],
    ...overrides,
  };
}

export function buildMatch(overrides: Partial<JobMatch> = {}): JobMatch {
  return {
    ...buildJob(),
    description: "Desarrollo de servicios.\nTrabajo en equipo.",
    requirements: [],
    hasPendingRequirements: false,
    ...overrides,
  };
}