import type { Prisma } from '../../../prisma/client.js';
import type { APPROVED_GRADUATE_CAREER_SELECT } from '../constants/approved-graduate-career-select.constants.js';

export type ApprovedGraduateCareerRecord = Prisma.AccessRequestGetPayload<{
  select: typeof APPROVED_GRADUATE_CAREER_SELECT;
}>;
