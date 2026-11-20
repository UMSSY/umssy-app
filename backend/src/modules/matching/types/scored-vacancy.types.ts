import type { ScoreRequirements } from './score-requirements.types.js';

export interface ScoredVacancy {
  requirements: ScoreRequirements;
  score: number;
}
