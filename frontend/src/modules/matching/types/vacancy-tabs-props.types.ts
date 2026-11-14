import type { Vacancy } from "./vacancy.types";

export interface VacancyTabsProps {
  vacancies: Vacancy[];
  activeVacancyId: string;
  onChange: (vacancyId: string) => void;
}
