import type { CvExistingEducation } from "./cv-existing-education.types";
import type { CvExistingWorkExperience } from "./cv-existing-work-experience.types";
import type { CvRecordMatch } from "./cv-record-match.types";

export interface CvExtractionMatches {
  education: CvRecordMatch<CvExistingEducation>[];
  experience: CvRecordMatch<CvExistingWorkExperience>[];
}
