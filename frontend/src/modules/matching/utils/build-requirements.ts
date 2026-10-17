import type { JobMatch, JobRequirement } from "../types/job-matching.types";

export function buildRequirements(match: JobMatch): JobRequirement[] {
  return [
    ...match.matchedSkills.map((name): JobRequirement => ({ name, status: "matched" })),
    ...match.missingSkills.map((name): JobRequirement => ({ name, status: "missing" })),
  ];
}
