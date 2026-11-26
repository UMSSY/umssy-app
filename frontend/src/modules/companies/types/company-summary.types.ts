export interface CompanySummary {
  id: string;
  name: string;
  sector: string | null;
  description: string | null;
  logoUrl: string | null;
  activeVacanciesCount: number;
}
