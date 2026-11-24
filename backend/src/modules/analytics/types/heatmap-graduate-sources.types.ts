import type { ApprovedGraduateCareer } from '../../access-requests/types/approved-graduate-career.types.js';
import type { UserSkillSummaryResponse } from '../../skills/responses/user-skill-summary.response.js';
import type { SurveyEmploymentResponse } from '../../surveys/responses/survey-employment-response.response.js';
import type { WorkPeriodResponse } from '../../work-experience/responses/work-period.response.js';

export interface HeatmapGraduateSources {
  responses: SurveyEmploymentResponse[];
  careers: ApprovedGraduateCareer[];
  skills: UserSkillSummaryResponse[];
  workPeriods: WorkPeriodResponse[];
}
