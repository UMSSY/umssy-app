export const FEATURED_COMPANIES_LIMIT = 3;

export const FEATURED_COMPANY_SELECT = {
  id: true,
  title: true,
  description: true,
  profile: { select: { sector: true } },
  logo: { select: { id: true } },
} as const;
