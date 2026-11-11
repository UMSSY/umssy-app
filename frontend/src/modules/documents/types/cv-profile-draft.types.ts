import type { CvExtractedEducation } from "./cv-extracted-education.types";
import type { CvExtractedWorkExperience } from "./cv-extracted-work-experience.types";
import type { CvProfileDraftContact } from "./cv-profile-draft-contact.types";

export interface CvProfileDraft {
  cvId: string;
  contact: CvProfileDraftContact;
  educations: CvExtractedEducation[];
  workExperiences: CvExtractedWorkExperience[];
}
