export const COMPANY_PROFILE_SELECT = {
  id: true,
  title: true,
  description: true,
  profile: {
    select: {
      sector: true,
      email: true,
      phone: true,
      websiteUrl: true,
      city: { select: { title: true } },
    },
  },
  logo: { select: { id: true } },
} as const;

export const COMPANY_VALIDATION_MESSAGES = {
  INVALID_COMPANY_ID: 'El identificador de la empresa no es válido',
} as const;
