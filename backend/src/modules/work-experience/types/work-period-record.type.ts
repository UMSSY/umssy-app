import type { Prisma } from '../../../prisma/client.js';
import type { WORK_PERIOD_SELECT } from '../constants/work-period-select.constants.js';

export type WorkPeriodRecord = Prisma.WorkExperienceGetPayload<{
  select: typeof WORK_PERIOD_SELECT;
}>;
