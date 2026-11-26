import type { CvRecordMatchStatus } from "./cv-record-match-status.types";
import type { CvExtractedWorkExperience } from "./cv-extracted-work-experience.types";

export interface CvWorkExperienceReviewProps {
  workExperiences?: readonly CvExtractedWorkExperience[];
  selected?: readonly number[];
  matchStatuses?: readonly CvRecordMatchStatus[];
  onToggle: (index: number) => void;
  onChange: (index: number, changes: Partial<CvExtractedWorkExperience>) => void;
}
