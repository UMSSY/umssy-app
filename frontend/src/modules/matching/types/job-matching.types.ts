import type { CategorizedJobRequirement } from "./requirement-category.types";
export type RequirementStatus = "Cumple" | "Pendiente";

export interface JobRequirement {
  name: string;
  status: RequirementStatus;
}

export interface RecommendedJob {
  jobOfferId: string;
  title: string;
  companyName: string;
  modality: string;
  locationUrl?: string;
  score: number;
  matchedSkills: string[];
  skills: string[];
}

export interface RecommendationsResult {
  isProfileComplete: boolean;
  items: RecommendedJob[];
}

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
