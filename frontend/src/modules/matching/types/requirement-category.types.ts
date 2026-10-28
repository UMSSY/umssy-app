import type { JobRequirement } from "./job-matching.types";

export type RequirementCategory = "skill" | "academic" | "other";

export type CategorizedJobRequirement = JobRequirement & {
  category?: RequirementCategory;
};

export interface RequirementGroup {
  category: RequirementCategory | null;
  requirements: CategorizedJobRequirement[];
}
