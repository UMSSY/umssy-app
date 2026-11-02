import type { Prisma } from '../../../prisma/client.js';
import { SURVEY_QUESTION_TYPES } from '../types/survey.enum.js';

export async function seedSurveyQuestionTypesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.surveyQuestionType.createMany({
    data: SURVEY_QUESTION_TYPES.map((title) => ({ title })),
    skipDuplicates: true,
  });
}
