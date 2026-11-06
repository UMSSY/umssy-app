import {
  MATCH_SCORE_WEIGHTS,
  MATCH_SCORE_WEIGHT_ENV_VARS,
  SCORE_CATEGORIES,
  type MatchScoreWeights,
  type ScoreCategory,
} from '../constants/match-score.constants.js';

export function resolveMatchScoreWeights(
  env: NodeJS.ProcessEnv = process.env,
): MatchScoreWeights {
  const weights: Record<ScoreCategory, number> = { ...MATCH_SCORE_WEIGHTS };

  for (const category of SCORE_CATEGORIES) {
    const variable = MATCH_SCORE_WEIGHT_ENV_VARS[category];
    const raw = env[variable]?.trim();
    if (!raw) continue;

    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(
        `${variable} must be a number greater than or equal to 0 (received "${raw}")`,
      );
    }
    weights[category] = value;
  }

  return weights;
}
