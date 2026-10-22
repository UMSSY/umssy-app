import type { SurveyStatus } from "./survey.types";

export interface SurveyStatusChange {
  id: string;
  status: Exclude<SurveyStatus, "DRAFT">;
}
