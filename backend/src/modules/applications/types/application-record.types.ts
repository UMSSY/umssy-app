import type { Prisma } from '../../../prisma/client.js';

export type ApplicationRecord = Prisma.JobApplicationGetPayload<{
  select: {
    id: true;
    jobOfferId: true;
    appliedAt: true;
    status: { select: { title: true } };
    jobOffer: {
      select: {
        title: true;
        expiresAt: true;
        status: { select: { title: true } };
        company: { select: { title: true } };
      };
    };
  };
}>;
