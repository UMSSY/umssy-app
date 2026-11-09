import type { SurveyDisplayStatus } from "./survey-display-status.types";
import type { SurveyTargetAudience } from "./survey-target-audience.types";
import type { Career } from "./career.types";
import type { SurveyCreator } from "./survey-creator.types";

export interface SurveySummary {
  id: string;
  title: string;
  status: SurveyDisplayStatus;
  career: Career | null;
  createdBy: SurveyCreator;
  academicPeriod: string | null;
  targetAudience?: SurveyTargetAudience | null;
  opensAt: string | null;
  closesAt: string | null;
  questionCount: number;
  responseCount?: number;
  createdAt: string;
}
