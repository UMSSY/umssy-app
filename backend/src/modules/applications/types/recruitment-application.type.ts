import type { Prisma } from '../../../prisma/client.js';
import type { RECRUITMENT_APPLICATION_SELECT } from '../constants/recruitment-application-select.constants.js';

export type RecruitmentApplication = Prisma.JobApplicationGetPayload<{
  select: typeof RECRUITMENT_APPLICATION_SELECT;
}>;
