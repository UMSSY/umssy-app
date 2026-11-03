import type { Prisma } from '../../../prisma/client.js';

export interface CompanyJobOffersQuery {
  where: Prisma.JobOfferWhereInput;
  orderBy: Prisma.JobOfferOrderByWithRelationInput[];
}
