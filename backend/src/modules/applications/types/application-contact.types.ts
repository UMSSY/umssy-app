import type { Prisma } from '../../../prisma/client.js';

export type ApplicationContactRecord = Prisma.JobApplicationGetPayload<{
  select: {
    id: true;
    userId: true;
    jobOfferId: true;
    status: { select: { title: true } };
    jobOffer: {
      select: {
        title: true;
        company: {
          select: {
            id: true;
            title: true;
            recruiters: {
              select: { id: true; firstName: true; lastName: true };
            };
          };
        };
      };
    };
  };
}>;

export interface ApplicationContactRecruiterResponse {
  id: string;
  fullName: string;
}

export interface ApplicationContactResponse {
  applicationId: string;
  jobOfferId: string;
  vacancyTitle: string;
  companyId: string;
  companyName: string;
  recruiters: ApplicationContactRecruiterResponse[];
}
