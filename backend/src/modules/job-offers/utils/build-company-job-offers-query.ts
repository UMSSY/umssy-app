import { DAY_MS } from '../../../common/constants/date-time.constants.js';
import { toUtcIso } from '../../../common/utils/date-time.js';
import type { Prisma } from '../../../prisma/client.js';
import type { ListCompanyJobOffersRequest } from '../requests/list-company-job-offers.request.js';

export interface CompanyJobOffersQuery {
  where: Prisma.JobOfferWhereInput;
  orderBy: Prisma.JobOfferOrderByWithRelationInput[];
}

const startOfBoliviaDay = (date: string): Date => new Date(toUtcIso(date, '00:00'));

function buildCreatedAtFilter(
  dateFrom: string | undefined,
  dateTo: string | undefined,
): Prisma.DateTimeFilter | undefined {
  if (!dateFrom && !dateTo) return undefined;

  return {
    ...(dateFrom && { gte: startOfBoliviaDay(dateFrom) }),
    ...(dateTo && { lt: new Date(startOfBoliviaDay(dateTo).getTime() + DAY_MS) }),
  };
}

export function buildCompanyJobOffersQuery(
  companyId: string,
  filters: ListCompanyJobOffersRequest,
): CompanyJobOffersQuery {
  const createdAt = buildCreatedAtFilter(filters.dateFrom, filters.dateTo);

  const where: Prisma.JobOfferWhereInput = {
    companyId,
    ...(filters.modality && { modality: { title: filters.modality } }),
    ...(filters.contractType && { contractType: { title: filters.contractType } }),
    ...(createdAt && { createdAt }),
    ...(filters.search && {
    title: { contains: filters.search, mode: 'insensitive' },
    }),
  };

  const orderBy: Prisma.JobOfferOrderByWithRelationInput[] = [
    { createdAt: filters.order },
    { id: filters.order },
  ];

  return { where, orderBy };
}