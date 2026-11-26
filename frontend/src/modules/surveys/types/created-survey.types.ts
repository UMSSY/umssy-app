import type { SurveyStatus } from "./survey-status.types";

export interface CreatedSurvey {
  id: string;
  title: string;
  status: SurveyStatus;
  createdAt: string;
}
