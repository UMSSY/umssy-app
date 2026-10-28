import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';
import { SURVEY_FIXTURES } from '../constants/survey-fixtures.constants.js';
import {
  surveyFixtureDate,
  surveyFixtureId,
} from '../utils/survey-fixture-ids.js';

export async function seedSurveysFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.SurveyCreateManyInput[] = SURVEY_FIXTURES.map(
    (survey) => ({
      id: surveyFixtureId(context, survey),
      title: survey.title,
      description: survey.description,
      careerId: context.getReference('careers', survey.career),
      academicPeriod: survey.academicPeriod,
      opensAt: surveyFixtureDate(context, survey.opensAtDays),
      closesAt: surveyFixtureDate(context, survey.closesAtDays),
      statusId: context.getReference('survey_statuses', survey.status),
      createdById: context.adminId,
      createdAt: surveyFixtureDate(context, survey.createdAtDays),
    }),
  );
  await tx.survey.createMany({ data, skipDuplicates: true });
  return data.length;
}
