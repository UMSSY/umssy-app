import type { RequirementCategory } from "./requirement-category.types";
import type { CategorizedJobRequirement } from "./categorized-job-requirement.types";

export interface RequirementGroup {
  category: RequirementCategory | null;
  requirements: CategorizedJobRequirement[];
}
