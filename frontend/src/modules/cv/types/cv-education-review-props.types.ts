import type { CvExtractedEducation } from "./cv-extracted-education.types";

export interface CvEducationReviewProps {
  educations?: readonly CvExtractedEducation[];
  selected?: readonly number[];
  onToggle: (index: number) => void;
  onChange: (index: number, changes: Partial<CvExtractedEducation>) => void;
}
