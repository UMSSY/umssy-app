export interface RecruiterVacancyResponse {
  id: string;
  title: string;
  companyId: string;
}
export interface ActiveVacancyResponse extends RecruiterVacancyResponse {
  description: string;
}
