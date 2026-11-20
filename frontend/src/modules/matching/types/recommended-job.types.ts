export interface RecommendedJob {
  jobOfferId: string;
  title: string;
  companyName: string;
  modality: string;
  locationUrl?: string;
  publishedAt: string;
  expiresAt: string | null;
  score: number;
  matchedSkills: string[];
  skills: string[];
}
