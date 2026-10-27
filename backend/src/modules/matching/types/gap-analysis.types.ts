import type { RequirementState } from './requirement-state.types.js';

export type RequirementCategory = 'skill' | 'academic' | 'other';

export interface VacancyRequirements {
  skills: readonly string[];
  careers?: readonly string[];
  minExperienceYears?: number | null;
  others?: readonly string[];
}

export interface CandidateProfile {
  skills: readonly string[];
  career?: string | null;
  experienceYears?: number | null;
  presentedOthers?: readonly string[];
}

export interface CategorizedRequirement extends RequirementState {
  category: RequirementCategory;
}
