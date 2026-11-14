import type { CvExtractedContactResponse } from './cv-extracted-contact.response.js';
import type { CvExtractedEducationResponse } from './cv-extracted-education.response.js';
import type { CvExtractedSkillResponse } from './cv-extracted-skill.response.js';
import type { CvExtractedWorkExperienceResponse } from './cv-extracted-work-experience.response.js';

export interface CvExtractionResponse {
  cvId: string;
  contact: CvExtractedContactResponse;
  presentation: string | null;
  educations: CvExtractedEducationResponse[];
  workExperiences: CvExtractedWorkExperienceResponse[];
  skills: CvExtractedSkillResponse[];
}
