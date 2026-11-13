import type { RecruiterApplicant } from "./recruiter-applicant.types";
import type { RecruiterTarget } from "./recruiter-target.types";
import type { RadarAxis } from "./radar-axis.types";

export interface RecruiterCandidatePanelProps {
  candidate: RecruiterApplicant | null;
  vacancy: RecruiterTarget | null;
  axes: RadarAxis[];
}
