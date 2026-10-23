import type { CategorizedRequirement } from './gap-analysis.types.js';

export interface JobRecommendation {
  jobOfferId: string;
  title: string;
  companyName: string;
  modality: string;
  score: number;
  skills: string[];
  matchedSkills: string[];
}

export interface JobRecommendations {
  isProfileComplete: boolean;
  items: JobRecommendation[];
}

export interface JobMatch extends JobRecommendation {
  description: string;
  requirements: CategorizedRequirement[];
  hasPendingRequirements: boolean;
}
