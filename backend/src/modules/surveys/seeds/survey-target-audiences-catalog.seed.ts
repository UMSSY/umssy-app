import type { Prisma } from '../../../prisma/client.js';
import { SURVEY_TARGET_AUDIENCES } from '../types/survey.enum.js';

export async function seedSurveyTargetAudiencesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.surveyTargetAudience.createMany({
    data: SURVEY_TARGET_AUDIENCES.map((title) => ({ title })),
    skipDuplicates: true,
  });
}
