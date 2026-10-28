export interface JobRecommendation {
  jobOfferId: string;
  title: string;
  companyName: string;
  modality: string;
  locationUrl: string;
  score: number;
  skills: string[];
  matchedSkills: string[];
}

export interface JobRecommendations {
  isProfileComplete: boolean;
  items: JobRecommendation[];
}
