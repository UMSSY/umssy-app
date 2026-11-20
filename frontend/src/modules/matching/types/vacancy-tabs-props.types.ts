import type { Vacancy } from "./vacancy.types";

export interface VacancyTabsProps {
  vacancies: Pick<Vacancy, "id" | "title">[];
  activeVacancyId: string;
  onChange: (vacancyId: string) => void;
}