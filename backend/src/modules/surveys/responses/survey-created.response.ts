import type { SurveyStatusValue } from '../types/survey.enum.js';

export interface SurveyCreatedResponse {
  id: string;
  title: string;
  status: SurveyStatusValue;
  createdAt: string;
}
