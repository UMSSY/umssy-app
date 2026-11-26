import type { CompanyProfileResponse } from '../responses/company-profile.response.js';
import type { CompanyProfileRecord } from '../types/company-profile-record.type.js';
import { buildCompanyLogoPath } from './build-company-logo-path.js';
import { emptyToNull } from './empty-to-null.js';

export function toCompanyProfileResponse(
  record: CompanyProfileRecord,
): CompanyProfileResponse {
  const { profile } = record;
  return {
    id: record.id,
    name: record.title,
    description: emptyToNull(record.description),
    sector: emptyToNull(profile?.sector),
    city: emptyToNull(profile?.city.title),
    phone: emptyToNull(profile?.phone),
    email: emptyToNull(profile?.email),
    website: emptyToNull(profile?.websiteUrl),
    logoUrl: buildCompanyLogoPath(record.id, record.logo),
  };
}
