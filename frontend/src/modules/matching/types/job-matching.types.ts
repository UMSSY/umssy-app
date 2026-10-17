export type RequirementStatus = "matched" | "missing";

export interface JobRequirement {
  name: string;
  status: RequirementStatus;
}

export interface RecommendedJob {
  jobOfferId: string;
  title: string;
  companyName: string;
  modality: string;
  score: number;
  matchedSkills: string[];
  matchedSkillIds: string[];
  missingSkills: string[];
  missingSkillIds: string[];
  skills: string[];
}

export interface RecommendationsResult {
  isProfileComplete: boolean;
  items: RecommendedJob[];
}

export interface JobMatch extends RecommendedJob {
  description: string;
}
