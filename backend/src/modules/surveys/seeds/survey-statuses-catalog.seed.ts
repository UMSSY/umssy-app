import type { Prisma } from '../../../prisma/client.js';
import { SURVEY_STATUSES } from '../types/survey.enum.js';

export async function seedSurveyStatusesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.surveyStatus.createMany({
    data: SURVEY_STATUSES.map((title) => ({ title })),
    skipDuplicates: true,
  });
}
