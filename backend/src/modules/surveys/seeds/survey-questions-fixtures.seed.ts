import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';
import { SURVEY_FIXTURES } from '../constants/survey-fixtures.constants.js';
import {
  surveyFixtureId,
  surveyQuestionFixtureId,
} from '../utils/survey-fixture-ids.js';

export async function seedSurveyQuestionsFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.SurveyQuestionCreateManyInput[] = SURVEY_FIXTURES.flatMap(
    (survey) =>
      survey.questions.map((question, questionIndex) => ({
        id: surveyQuestionFixtureId(context, survey, questionIndex),
        surveyId: surveyFixtureId(context, survey),
        position: questionIndex + 1,
        statement: question.statement,
        typeId: context.getReference('survey_question_types', question.type),
        isRequired: question.isRequired,
      })),
  );
  await tx.surveyQuestion.createMany({ data, skipDuplicates: true });
  return data.length;
}
