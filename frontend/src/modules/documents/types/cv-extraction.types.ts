import type { CvExtractedContact } from "./cv-extracted-contact.types";
import type { CvExtractedEducation } from "./cv-extracted-education.types";
import type { CvExtractedPresentation } from "./cv-extracted-presentation.types";
import type { CvExtractedSkill } from "./cv-extracted-skill.types";
import type { CvExtractedWorkExperience } from "./cv-extracted-work-experience.types";

export interface CvExtraction {
  cvId: string;
  contact: CvExtractedContact;
  presentation: CvExtractedPresentation;
  educations: CvExtractedEducation[];
  workExperiences: CvExtractedWorkExperience[];
  skills: CvExtractedSkill[];
}
