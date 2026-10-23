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

function buildCareerRequirements(
  careers: readonly string[],
  candidateCareer: string | null | undefined,
): RequirementState[] {
  const accepted = uniqueNames(careers);
  if (accepted.length === 0) return [];

  const candidateKey = buildSkillKey(candidateCareer ?? '');
  const fulfilled =
    candidateKey !== '' &&
    accepted.some((career) => buildSkillKey(career) === candidateKey);

  return [toState(accepted.join(' o '), fulfilled)];
}

function buildExperienceRequirements(
  minYears: number | null | undefined,
  candidateYears: number | null | undefined,
): RequirementState[] {
  if (minYears == null || !Number.isFinite(minYears) || minYears <= 0)
    return [];

  const name =
    minYears === 1
      ? 'Experiencia mínima: 1 año'
      : `Experiencia mínima: ${minYears} años`;
  const fulfilled =
    typeof candidateYears === 'number' && candidateYears >= minYears;

  return [toState(name, fulfilled)];
}


function buildOtherRequirements(
  others: readonly string[],
  presented: readonly string[],
): RequirementState[] {
  const presentedKeys = new Set(presented.map(buildSkillKey));
  return uniqueNames(others).map((name) =>
    toState(name, presentedKeys.has(buildSkillKey(name))),
  );
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
    academicRequirements: buildCareerRequirements(
      vacancy.careers ?? [],
      candidate.career,
    ),
    experienceRequirements: buildExperienceRequirements(
      vacancy.minExperienceYears,
      candidate.experienceYears,
    ),
    otherRequirements: buildOtherRequirements(
      vacancy.others ?? [],
      candidate.presentedOthers ?? [],
    ),
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
