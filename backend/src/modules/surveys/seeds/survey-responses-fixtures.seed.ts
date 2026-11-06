import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';
import { SURVEY_FIXTURES } from '../constants/survey-fixtures.constants.js';
import {
  fixtureUserIdByNumber,
  surveyFixtureDate,
  surveyFixtureId,
  surveyResponseFixtureId,
} from '../utils/survey-fixture-ids.js';

export async function seedSurveyResponsesFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.SurveyResponseCreateManyInput[] = SURVEY_FIXTURES.flatMap(
    (survey) =>
      survey.respondentNumbers.map((respondentNumber, index) => ({
        id: surveyResponseFixtureId(context, survey, respondentNumber),
        surveyId: surveyFixtureId(context, survey),
        respondentId: fixtureUserIdByNumber(context, respondentNumber),
        submittedAt: surveyFixtureDate(
          context,
          (survey.opensAtDays ?? survey.createdAtDays) + index + 1,
        ),
      })),
  );
  await tx.surveyResponse.createMany({ data, skipDuplicates: true });
  return data.length;
}
