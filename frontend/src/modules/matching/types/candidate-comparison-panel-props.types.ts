import type { ReactNode } from "react";
import type { AxisScores } from "./axis-scores.types";
import type { RadarAxis } from "./radar-axis.types";
import type { RadarAxisId } from "./radar-axis-id.types";

export interface CandidateComparisonPanelProps {
  name: string;
  role: string;
  matchPercent: number;
  vacancyTitle: string;
  scores: AxisScores;
  target: AxisScores;
  gaps: AxisScores;
  axes: RadarAxis[];
  onAxisSelect: (id: RadarAxisId) => void;
  status?: string;
  children: ReactNode;
}
