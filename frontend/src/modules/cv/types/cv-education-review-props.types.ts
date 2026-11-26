import type { CvRecordMatchStatus } from "./cv-record-match-status.types";
import type { CvExtractedEducation } from "./cv-extracted-education.types";

export interface CvEducationReviewProps {
  educations?: readonly CvExtractedEducation[];
  selected?: readonly number[];
  matchStatuses?: readonly CvRecordMatchStatus[];
  onToggle: (index: number) => void;
  onChange: (index: number, changes: Partial<CvExtractedEducation>) => void;
}
