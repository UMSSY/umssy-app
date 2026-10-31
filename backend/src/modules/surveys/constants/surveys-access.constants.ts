import type { RoleName } from '../../../common/enums/roles.enum.js';
import { SurveyTargetAudience } from '../types/survey.enum.js';

export const SURVEYS_ROLE: RoleName = 'administrativo';

export const SURVEY_RESPONDENT_ROLES = ['titulado', 'estudiante', 'mentor'] as const satisfies readonly RoleName[];

export const SURVEY_AUDIENCE_ROLES: Readonly<Record<SurveyTargetAudience, readonly RoleName[]>> = {
  [SurveyTargetAudience.ALL]: SURVEY_RESPONDENT_ROLES,
  [SurveyTargetAudience.GRADUATES]: ['titulado'],
  [SurveyTargetAudience.STUDENTS]: ['estudiante'],
  [SurveyTargetAudience.MENTORS]: ['mentor'],
};
