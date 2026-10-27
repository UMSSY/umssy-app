import { Injectable } from '@nestjs/common';
import type { MatchScoreWeights } from '../constants/match-score.constants.js';
import type { ScoreRequirements } from '../types/score-requirements.types.js';
import { calculateWeightedScore } from '../utils/calculate-weighted-score.js';
import { resolveMatchScoreWeights } from '../utils/resolve-match-score-weights.js';

@Injectable()
export class WeightedScoreService {
  private readonly defaultWeights: MatchScoreWeights =
    resolveMatchScoreWeights();

  calculate(
    requirements: ScoreRequirements,
    weights: MatchScoreWeights = this.defaultWeights,
  ): number {
    return calculateWeightedScore(requirements, weights);
  }
}
