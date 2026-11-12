import type { CvApplyReport } from "./cv-apply-report.types";
import type { CvExtractedContact } from "./cv-extracted-contact.types";
import type { CvExtractedEducation } from "./cv-extracted-education.types";
import type { CvExtractedPresentation } from "./cv-extracted-presentation.types";
import type { CvExtractedWorkExperience } from "./cv-extracted-work-experience.types";
import type { CvExtraction } from "./cv-extraction.types";
import type { CvExtractionSection } from "./cv-extraction-section.types";
import type { CvExtractionSelection } from "./cv-extraction-selection.types";

export interface CvExtractionDialogProps {
  isOpen: boolean;
  isExtracting: boolean;
  extraction: CvExtraction | null;
  available: CvExtractionSelection;
  selection: CvExtractionSelection;
  errorMessage?: string | null;
  isApplying?: boolean;
  applyReport?: CvApplyReport | null;
  onToggleItem: <K extends CvExtractionSection>(section: K, item: CvExtractionSelection[K][number]) => void;
  onToggleSection: (section: CvExtractionSection) => void;
  onContactChange: (changes: Partial<CvExtractedContact>) => void;
  onPresentationChange: (changes: Partial<CvExtractedPresentation>) => void;
  onEducationChange: (index: number, changes: Partial<CvExtractedEducation>) => void;
  onWorkExperienceChange: (index: number, changes: Partial<CvExtractedWorkExperience>) => void;
  onApply: () => void;
  onClose: () => void;
}
