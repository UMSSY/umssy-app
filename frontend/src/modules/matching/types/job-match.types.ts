import type { CategorizedJobRequirement } from "./categorized-job-requirement.types";

export interface JobMatch {
  jobOfferId: string;
  title: string;
  companyName: string;
  modality: string;
  description: string;
  publishedAt: string;
  expiresAt: string | null;
  score: number;
  requirements: CategorizedJobRequirement[];
  hasPendingRequirements: boolean;
}
