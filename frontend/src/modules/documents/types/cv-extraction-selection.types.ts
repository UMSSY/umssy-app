import type { CvContactField } from "./cv-contact-field.types";

export interface CvExtractionSelection {
  contactFields: CvContactField[];
  educations: number[];
  workExperiences: number[];
}
