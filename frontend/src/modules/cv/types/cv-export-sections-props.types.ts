import type { CvExportSectionKey } from "./cv-export-section-key.types";
import type { CvExportSections } from "./cv-export-sections.types";

export interface CvExportSectionsProps {
  sections: CvExportSections;
  repositoryCount: number;
  isDisabled: boolean;
  onToggle: (key: CvExportSectionKey) => void;
}
