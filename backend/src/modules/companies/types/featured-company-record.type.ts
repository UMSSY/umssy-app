import type { Prisma } from '../../../prisma/client.js';
import type { FEATURED_COMPANY_SELECT } from '../constants/featured-companies.constants.js';

export type FeaturedCompanyRecord = Prisma.CompanyGetPayload<{
  select: typeof FEATURED_COMPANY_SELECT;
}>;
