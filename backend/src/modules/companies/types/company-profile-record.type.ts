import type { Prisma } from '../../../prisma/client.js';
import type { COMPANY_PROFILE_SELECT } from '../constants/company-profile.constants.js';

export type CompanyProfileRecord = Prisma.CompanyGetPayload<{
  select: typeof COMPANY_PROFILE_SELECT;
}>;
