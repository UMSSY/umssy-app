import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';
import { SURVEY_FIXTURES } from '../constants/survey-fixtures.constants.js';
import { SurveyQuestionType } from '../types/survey.enum.js';
import {
  selectedOptionIndexes,
  surveyOptionFixtureId,
  surveyQuestionFixtureId,
  surveyResponseFixtureId,
} from '../utils/survey-fixture-ids.js';

export async function seedSurveyAnswersFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.SurveyAnswerCreateManyInput[] = SURVEY_FIXTURES.flatMap(
    (survey) =>
      survey.respondentNumbers.flatMap((respondentNumber) =>
        survey.questions.flatMap((question, questionIndex) =>
          selectedOptionIndexes(
            respondentNumber,
            questionIndex,
            question.options.length,
            question.type === SurveyQuestionType.MULTIPLE_CHOICE,
          ).map((optionIndex) => ({
            id: context.getId(
              `survey-${survey.key}-response-${respondentNumber}-question-${questionIndex}-option-${optionIndex}`,
            ),
            responseId: surveyResponseFixtureId(
              context,
              survey,
              respondentNumber,
            ),
            questionId: surveyQuestionFixtureId(context, survey, questionIndex),
            optionId: surveyOptionFixtureId(
              context,
              survey,
              questionIndex,
              optionIndex,
            ),
          })),
        ),
      ),
  );
  await tx.surveyAnswer.createMany({ data, skipDuplicates: true });
  return data.length;
}
