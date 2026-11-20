import type { RecommendedJob } from "./recommended-job.types";

export interface RecommendationsResult {
  isProfileComplete: boolean;
  items: RecommendedJob[];
}
