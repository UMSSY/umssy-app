import type { CvContactField } from "./cv-contact-field.types";
import type { CvExtraction } from "./cv-extraction.types";
import type { CvExtractionSelection } from "./cv-extraction-selection.types";

export interface CvExtractionDialogProps {
  isOpen: boolean;
  isExtracting: boolean;
  extraction: CvExtraction | null;
  selection: CvExtractionSelection;
  errorMessage?: string | null;
  onToggleContactField: (field: CvContactField) => void;
  onToggleEducation: (index: number) => void;
  onToggleWorkExperience: (index: number) => void;
  onApply: () => void;
  onClose: () => void;
}
