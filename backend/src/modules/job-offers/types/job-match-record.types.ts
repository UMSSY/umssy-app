import type { Prisma } from '../../../prisma/client.js';
import type { JOB_MATCH_SELECT } from '../constants/job-match.constants.js';
export type JobOfferMatchRecord = Prisma.JobOfferGetPayload<{
  select: typeof JOB_MATCH_SELECT;
}>;
