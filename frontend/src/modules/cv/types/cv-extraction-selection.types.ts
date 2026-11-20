import type { CvContactField } from "./cv-contact-field.types";

export interface CvExtractionSelection {
  contact: CvContactField[];
  presentation: number[];
  education: number[];
  experience: number[];
  skills: number[];
}
