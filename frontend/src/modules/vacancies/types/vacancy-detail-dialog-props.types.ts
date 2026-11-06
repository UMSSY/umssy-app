import type { Vacancy } from "./vacancy.types";

export interface VacancyDetailDialogProps {
  vacancy: Vacancy | null;
  onClose: () => void;
}
