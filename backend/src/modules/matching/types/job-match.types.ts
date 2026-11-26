import type { CategorizedRequirement } from './gap-analysis.types.js';

export type { JobOfferMatchRecord as JobMatchRecord } from '../../job-offers/types/job-match-record.types.js';

export interface CandidateProfileRecord {
  career: string | null;
  experienceYears: number;
}

export interface JobMatchResponse {
  jobOfferId: string;
  title: string;
  companyName: string;
  modality: string;
  description: string;
  publishedAt: string;
  expiresAt: string | null;
  score: number;
  hasPendingRequirements: boolean;
  requirements: CategorizedRequirement[];
}
