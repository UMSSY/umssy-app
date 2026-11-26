import type { SurveyStatus } from "./survey-status.types";
import type { SurveyTargetAudience } from "./survey-target-audience.types";
import type { CreateSurveyQuestionPayload } from "./create-survey-question-payload.types";

export interface CreateSurveyPayload {
  title: string;
  description?: string;
  careerId?: string;
  academicPeriod?: string;
  targetAudience?: SurveyTargetAudience;
  opensAt?: string;
  closesAt?: string;
  status: SurveyStatus;
  questions: CreateSurveyQuestionPayload[];
}
