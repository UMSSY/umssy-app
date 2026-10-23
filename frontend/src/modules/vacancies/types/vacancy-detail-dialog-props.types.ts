import type { Vacancy } from "../data/vacancies";

export interface VacancyDetailDialogProps {
  vacancy: Vacancy | null;
  onClose: () => void;
}
