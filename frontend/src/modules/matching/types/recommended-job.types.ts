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
