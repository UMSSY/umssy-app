import type { CategorizedJobRequirement } from "./categorized-job-requirement.types";

export interface MissingRequirementsProps {
  requirements: CategorizedJobRequirement[];
  title?: string;
}
