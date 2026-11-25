import type { CvExistingEducation } from "./cv-existing-education.types";
import type { CvExistingWorkExperience } from "./cv-existing-work-experience.types";

export interface CvExistingRecords {
  workExperiences: readonly CvExistingWorkExperience[];
  educations: readonly CvExistingEducation[];
}
