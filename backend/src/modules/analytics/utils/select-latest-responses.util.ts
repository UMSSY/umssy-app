import type { SurveyEmploymentResponse } from '../../surveys/responses/survey-employment-response.response.js';

export function selectLatestResponsePerRespondent(
  responses: SurveyEmploymentResponse[],
): SurveyEmploymentResponse[] {
  const latest = new Map<string, SurveyEmploymentResponse>();
  for (const response of responses ?? []) {
    const current = latest.get(response.respondentId);
    if (!current || current.submittedAt < response.submittedAt)
      latest.set(response.respondentId, response);
  }
  return [...latest.values()];
}
