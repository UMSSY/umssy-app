export interface JobRecommendation {
  jobOfferId: string;
  title: string;
  companyName: string;
  modality: string;
  locationUrl: string;
  publishedAt: string;
  expiresAt: string | null;
  score: number;
  skills: string[];
  matchedSkills: string[];
}

export interface JobRecommendations {
  isProfileComplete: boolean;
  items: JobRecommendation[];
}
