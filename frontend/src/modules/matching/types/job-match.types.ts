import type { CategorizedJobRequirement } from "./categorized-job-requirement.types";

export interface JobMatch {
  jobOfferId: string;
  title: string;
  companyName: string;
  modality: string;
  description: string;
  score: number;
  requirements: CategorizedJobRequirement[];
  hasPendingRequirements: boolean;
}
