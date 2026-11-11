import type { CvExtractedContact } from "./cv-extracted-contact.types";
import type { CvExtractedEducation } from "./cv-extracted-education.types";
import type { CvExtractedWorkExperience } from "./cv-extracted-work-experience.types";

export interface CvExtractionResponse {
  cvId: string;
  contact?: Partial<CvExtractedContact> | null;
  educations?: CvExtractedEducation[] | null;
  workExperiences?: CvExtractedWorkExperience[] | null;
}
