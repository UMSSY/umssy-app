import type { SurveyTargetAudienceValue } from './survey.enum.js';

export interface GraduateProfile {
  careerId: string;
  graduationYear: number;
}

export interface SurveyAudience {
  career?: { id: string } | null;
  academicPeriod?: string | null;
  targetAudience?: SurveyTargetAudienceValue | null;
}
