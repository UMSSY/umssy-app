import type { ProfileResponse } from "@/modules/profile";
import type { CvEducationNamesResolver } from "./cv-education-names-resolver.types";
import type { CvExtraction } from "./cv-extraction.types";
import type { CvExtractionSelection } from "./cv-extraction-selection.types";

export interface CvApplyRequest {
  extraction: CvExtraction;
  selection: CvExtractionSelection;
  profile: ProfileResponse | null;
  resolveEducationNames?: CvEducationNamesResolver;
}
