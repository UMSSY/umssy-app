import type { CompanyActiveOffers } from '../../job-offers/types/company-active-offers.type.js';
import { FEATURED_COMPANIES_LIMIT } from '../constants/featured-companies.constants.js';
import type { FeaturedCompanyResponse } from '../responses/featured-company.response.js';
import type { FeaturedCompanyRecord } from '../types/featured-company-record.type.js';
import { buildCompanyLogoPath } from './build-company-logo-path.js';
import { emptyToNull } from './empty-to-null.js';

export function toFeaturedCompanies(
  records: FeaturedCompanyRecord[],
  counts: CompanyActiveOffers[],
): FeaturedCompanyResponse[] {
  const activeByCompany = new Map(
    counts.map(({ companyId, activeOffers }) => [companyId, activeOffers]),
  );
  return records
    .map((record) => ({
      id: record.id,
      name: record.title,
      sector: emptyToNull(record.profile?.sector),
      description: emptyToNull(record.description),
      logoUrl: buildCompanyLogoPath(record.id, record.logo),
      activeVacanciesCount: activeByCompany.get(record.id) ?? 0,
    }))
    .filter(({ activeVacanciesCount }) => activeVacanciesCount > 0)
    .sort(
      (a, b) =>
        b.activeVacanciesCount - a.activeVacanciesCount ||
        a.name.localeCompare(b.name, 'es'),
    )
    .slice(0, FEATURED_COMPANIES_LIMIT);
}
