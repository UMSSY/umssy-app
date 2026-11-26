import type { CompanyProfileResponse } from '../responses/company-profile.response.js';
import type { CompanyProfileRecord } from '../types/company-profile-record.type.js';

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

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
    logoUrl: record.logo ? `/companies/${record.id}/logo` : null,
  };
}
