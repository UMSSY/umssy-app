import type { RoleName } from '../../../common/enums/roles.enum.js';

export interface SurveyAudienceFilter {
  surveyId: string;
  roles: readonly RoleName[];
  careerId: string | null;
  graduationYear: number | null;
}
