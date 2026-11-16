import type { ReactNode } from "react";
import type { CvExtractionSection } from "./cv-extraction-section.types";

export interface CvReviewSectionProps {
  section: CvExtractionSection;
  selectedCount: number;
  availableCount: number;
  isFullySelected: boolean;
  onToggleSection: () => void;
  children?: ReactNode;
}
