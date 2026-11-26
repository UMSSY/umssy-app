import type { RecruiterComparison } from "../types/recruiter-comparison.types";
import type { PublishedEvidence } from "../types/published-evidence.types";
import type { RecruiterApplicationState } from "../types/recruiter-application-state.types";
import type { AxisScores } from "../types/axis-scores.types";

export interface RecruiterApplicant {
  applicationId: string;
  userId: string;
  name: string;
  headline: string;
  email: string | null;
  phone: string | null;
  appliedAt: string;
  state: RecruiterApplicationState;
  canViewCv: boolean;
  version: number;
  average: number;
  scores: AxisScores;
  evidence: Record<string, PublishedEvidence[]>;
  comparison: RecruiterComparison;
  skills: string[];
}
