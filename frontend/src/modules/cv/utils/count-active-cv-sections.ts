import type { CvExportSections } from "../types/cv-export-sections.types";

export function countActiveCvSections(sections: CvExportSections): number {
  return Object.values(sections).filter(Boolean).length;
}
