import {
  MATCH_SCORE_WEIGHTS,
  SCORE_CATEGORIES,
  type MatchScoreWeights,
} from '../constants/match-score.constants.js';

import type { ScoreRequirements } from '../types/score-requirements.types.js';
export function assertValidWeights(weights: MatchScoreWeights): void {
  for (const category of SCORE_CATEGORIES) {
    const weight = weights[category];
    if (!Number.isFinite(weight) || weight < 0) {
      throw new RangeError(
        `Invalid match score weight for "${category}": ${String(weight)}`,
      );
    }
  }
}

export function calculateWeightedScore(
  requirements: ScoreRequirements,
  weights: MatchScoreWeights = MATCH_SCORE_WEIGHTS,
): number {
  assertValidWeights(weights);

  const scale = Math.max(
    ...SCORE_CATEGORIES.map((category) => weights[category]),
  );
  if (scale === 0) return 100;

  let totalWeight = 0;
  let matchedWeight = 0;

  for (const category of SCORE_CATEGORIES) {
    const items = requirements[category];
    if (items.length === 0) continue;

    const weight = weights[category] / scale;
    const fulfilled = items.filter(({ status }) => status === 'Cumple').length;
    totalWeight += weight;
    matchedWeight += (weight * fulfilled) / items.length;
  }

  if (totalWeight === 0) return 100;

  const rawScore = (matchedWeight / totalWeight) * 100;
  return Math.min(Math.max(Math.round(rawScore + 1e-10), 0), 100);
}
