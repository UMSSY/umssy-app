import type { Modality } from "./modality.types";
import type { SkillOption } from "./skill-option.types";

export interface VacancyConditions {
  title: string;
  modality: Modality | null;
  mapsLink: string;
  contractType: string;
  category: string;
  vacancyCount: string;
  salary: string;
  languages: string;
  description: string;
  skills: SkillOption[];
}
