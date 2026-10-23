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