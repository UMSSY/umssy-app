import { SCORE_CATEGORIES } from '../constants/match-score.constants.js';
import type {
  CandidateProfile,
  CategorizedRequirement,
  RequirementCategory,
  VacancyRequirements,
} from '../types/gap-analysis.types.js';
import type { RequirementState } from '../types/requirement-state.types.js';
import type { ScoreRequirements } from '../types/score-requirements.types.js';
import { buildSkillKey } from './build-skill-key.js';

function toState(name: string, fulfilled: boolean): RequirementState {
  return { name, status: fulfilled ? 'Cumple' : 'Pendiente' };
}

function uniqueNames(names: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of names) {
    const name = raw.trim();
    const key = buildSkillKey(name);
    if (key === '' || seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

export function buildScoreRequirements(
  vacancy: VacancyRequirements,
  candidate: CandidateProfile,
): ScoreRequirements {
  const candidateSkillKeys = new Set(candidate.skills.map(buildSkillKey));

  return {
    skills: uniqueNames(vacancy.skills).map((name) =>
      toState(name, candidateSkillKeys.has(buildSkillKey(name))),
    ),
    academicRequirements: [],
    experienceRequirements: [],
    otherRequirements: [],
  };
}

const CATEGORY_BY_SCORE_CATEGORY: Record<
  (typeof SCORE_CATEGORIES)[number],
  RequirementCategory
> = {
  skills: 'skill',
  academicRequirements: 'academic',
  experienceRequirements: 'academic',
  otherRequirements: 'other',
};

export function toCategorizedRequirements(
  requirements: ScoreRequirements,
): CategorizedRequirement[] {
  return SCORE_CATEGORIES.flatMap((scoreCategory) =>
    requirements[scoreCategory].map(({ name, status }) => ({
      name,
      status,
      category: CATEGORY_BY_SCORE_CATEGORY[scoreCategory],
    })),
  );
}

export function hasPendingRequirements(
  requirements: ScoreRequirements,
): boolean {
  return SCORE_CATEGORIES.some((category) =>
    requirements[category].some(({ status }) => status === 'Pendiente'),
  );
}
