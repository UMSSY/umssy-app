import type { AxisScores } from "./axis-scores.types";
import type { Candidate } from "./candidate.types";
import type { CandidateStatus } from "./candidate-status.types";

export interface CandidateWithMatch extends Candidate {
  matchPercent: number;
  gaps: AxisScores;
  status: CandidateStatus;
}
