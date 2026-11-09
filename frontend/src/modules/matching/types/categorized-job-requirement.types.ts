import type { JobRequirement } from "./job-requirement.types";
import type { RequirementCategory } from "./requirement-category.types";

export type CategorizedJobRequirement = JobRequirement & {
  category?: RequirementCategory;
};
