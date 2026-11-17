export const JOB_MATCH_SELECT = {
  id: true,
  title: true,
  description: true,
  createdAt: true,
  locationUrl: true,
  requiredCareers: true,
  minExperienceYears: true,
  otherRequirements: true,
  company: { select: { title: true } },
  modality: { select: { title: true } },
  skills: {
    select: { skill: { select: { name: true } } },
    orderBy: { skill: { name: 'asc' } },
  },
} as const;
