import type { SurveyListItem } from "./survey.types";

export interface SurveysTableProps {
  surveys: SurveyListItem[];
  isLoading: boolean;
  errorMessage?: string;
  searchTerm?: string;
}
