export const MATCH_SCORE_WEIGHTS = {
  skills: 60,
  academicRequirements: 25,
  experienceRequirements: 10,
  otherRequirements: 5,
} as const;

export const SCORE_CATEGORIES = [
  'skills',
  'academicRequirements',
  'experienceRequirements',
  'otherRequirements',
] as const;

export type ScoreCategory = typeof SCORE_CATEGORIES[number];

export type MatchScoreWeights = Readonly<Record<ScoreCategory, number>>;

export const MATCH_SCORE_WEIGHT_ENV_VARS: Readonly<
  Record<ScoreCategory, string>
> = {
  skills: 'MATCH_SCORE_WEIGHT_SKILLS',
  academicRequirements: 'MATCH_SCORE_WEIGHT_ACADEMIC',
  experienceRequirements: 'MATCH_SCORE_WEIGHT_EXPERIENCE',
  otherRequirements: 'MATCH_SCORE_WEIGHT_OTHER',
};

