import type { AffinityAxis } from "./affinity-axis.types";
import type { AxisScores } from "./axis-scores.types";

export interface GapBreakdownListProps {
  axes: AffinityAxis[];
  gaps: AxisScores;
}
