export function buildCompanyLogoPath(
  companyId: string,
  logo: { id: string } | null,
): string | null {
  return logo ? `/companies/${companyId}/logo` : null;
}
