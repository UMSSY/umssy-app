import type { RecruiterVacancyResponse } from './recruiter-vacancy-response.type.js';

export interface ActiveVacancyResponse extends RecruiterVacancyResponse {
  description: string;
}
