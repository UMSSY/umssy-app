import type { AxisScores } from "./axis-scores.types";

export interface Candidate {
  id: string;
  name: string;
  role: string;
  technologies: string[];
  demoPhone: string;
  scores: AxisScores;
}
