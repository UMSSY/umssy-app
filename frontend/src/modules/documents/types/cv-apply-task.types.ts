import type { CvExtractionSection } from "./cv-extraction-section.types";

export interface CvApplyTask {
  section: CvExtractionSection;
  items: readonly (string | number)[];
  label: string;
  run: () => Promise<unknown>;
}
