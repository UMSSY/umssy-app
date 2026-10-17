export interface DetectedSkillResponse {
  id: string;
  name: string;
}

export interface AnalyzeExperienceInput {
  experienceId: string;
  text?: string | null;
}

export interface AnalyzeExperienceResponse {
  experienceId: string;
  skills: DetectedSkillResponse[];
  processingTimeMs: number;
}

export interface RecommendedJobResponse {
  jobOfferId: string;
  title: string;
  companyName: string;
  modality: string;
  score: number;
  matchedSkills: string[];
  skills: string[];
}

export interface RecommendationsResponse {
  isProfileComplete: boolean;
  items: RecommendedJobResponse[];
}

export interface MatchingInput {
  userCareer: string;
  userExperienceYears: number;
  userSkills: string[];
  requiredCareer?: string | null;
  minimumExperienceYears: number;
  requiredSkills: string[];
}

export interface MatchingResult {
  careerMatch: boolean;
  experienceMatch: boolean;
  matchedSkills: string[];
  allRequiredSkillsMatch: boolean;
}
