import type { RecruiterVacancyResponse } from './recruiter-vacancy-response.types.js';

export interface ActiveVacancyResponse extends RecruiterVacancyResponse {
  description: string;
}
