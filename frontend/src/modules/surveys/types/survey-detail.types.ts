import type { SurveyDisplayStatus } from "./survey-display-status.types";
import type { SurveyTargetAudience } from "./survey-target-audience.types";
import type { Career } from "./career.types";
import type { SurveyDetailQuestion } from "./survey-detail-question.types";

export interface SurveyDetail {
  id: string;
  title: string;
  description: string | null;
  status: SurveyDisplayStatus;
  career: Career | null;
  targetsAllCareers?: boolean;
  academicPeriod: string | null;
  targetAudience?: SurveyTargetAudience | null;
  opensAt: string | null;
  closesAt: string | null;
  hasAnswered?: boolean;
  isExpired?: boolean;
  responseCount?: number;
  questions: SurveyDetailQuestion[];
}
