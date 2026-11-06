import type { Prisma } from '../../../prisma/client.js';
import type { JOB_MATCH_SELECT } from '../constants/job-match.constants.js';
import type { CategorizedRequirement } from './gap-analysis.types.js';

export type JobMatchRecord = Prisma.JobOfferGetPayload<{
  select: typeof JOB_MATCH_SELECT;
}>;

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
  score: number;
  hasPendingRequirements: boolean;
  requirements: CategorizedRequirement[];
}
