import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';
import { SURVEY_FIXTURES } from '../constants/survey-fixtures.constants.js';
import {
  surveyOptionFixtureId,
  surveyQuestionFixtureId,
} from '../utils/survey-fixture-ids.js';

export async function seedSurveyQuestionOptionsFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.SurveyQuestionOptionCreateManyInput[] =
    SURVEY_FIXTURES.flatMap((survey) =>
      survey.questions.flatMap((question, questionIndex) =>
        question.options.map((label, optionIndex) => ({
          id: surveyOptionFixtureId(
            context,
            survey,
            questionIndex,
            optionIndex,
          ),
          questionId: surveyQuestionFixtureId(context, survey, questionIndex),
          position: optionIndex + 1,
          label,
        })),
      ),
    );
  await tx.surveyQuestionOption.createMany({ data, skipDuplicates: true });
  return data.length;
}
