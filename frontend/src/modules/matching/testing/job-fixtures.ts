import type { JobMatch, RecommendedJob } from "../types/job-matching.types";

export function buildJob(overrides: Partial<RecommendedJob> = {}): RecommendedJob {
  return {
    jobOfferId: "o1",
    title: "Desarrollador Backend",
    companyName: "Empresa SA",
    modality: "Remoto",
    score: 67,
    matchedSkills: ["Python", "Docker"],
    matchedSkillIds: ["s1", "s2"],
    missingSkills: ["React"],
    missingSkillIds: ["s3"],
    skills: ["Python", "Docker", "React"],
    ...overrides,
  };
}

export function buildMatch(overrides: Partial<JobMatch> = {}): JobMatch {
  return { ...buildJob(), description: "Desarrollo de servicios.\nTrabajo en equipo.", ...overrides };
}
