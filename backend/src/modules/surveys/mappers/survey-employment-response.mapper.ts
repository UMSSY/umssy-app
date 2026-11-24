import {
  EMPLOYMENT_STATUS_QUESTION,
  MONTHLY_SALARY_QUESTION,
} from '../constants/survey-employment.constants.js';
import type { SurveyEmploymentResponse } from '../responses/survey-employment-response.response.js';
import type { SurveyEmploymentResponseRecord } from '../types/survey-employment-response-record.type.js';

function findOptionLabel(
  record: SurveyEmploymentResponseRecord,
  statement: string,
): string | null {
  return (
    record.answers.find((answer) => answer.question.statement === statement)
      ?.option?.label ?? null
  );
}

export function toSurveyEmploymentResponse(
  record: SurveyEmploymentResponseRecord,
): SurveyEmploymentResponse {
  return {
    respondentId: record.respondentId,
    submittedAt: record.submittedAt,
    employmentStatusLabel: findOptionLabel(record, EMPLOYMENT_STATUS_QUESTION),
    monthlySalaryLabel: findOptionLabel(record, MONTHLY_SALARY_QUESTION),
  };
}
