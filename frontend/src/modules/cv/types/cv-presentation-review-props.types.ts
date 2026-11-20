import type { CvExtractedPresentation } from "./cv-extracted-presentation.types";

export interface CvPresentationReviewProps {
  presentation: CvExtractedPresentation;
  isHeadlineMissing: boolean;
  onChange: (changes: Partial<CvExtractedPresentation>) => void;
}
