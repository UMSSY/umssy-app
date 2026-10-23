export const JOB_OFFER_NOT_AVAILABLE_MESSAGE =
  'La vacante no existe o no está disponible';

export const JOB_MATCH_SELECT = {
  id: true,
  title: true,
  description: true,
  company: { select: { title: true } },
  modality: { select: { title: true } },
  skills: {
    select: { skill: { select: { name: true } } },
    orderBy: { skill: { name: 'asc' } },
  },
} as const;
