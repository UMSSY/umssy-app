export const RECRUITMENT_APPLICATION_SELECT = {
  id: true,
  userId: true,
  jobOfferId: true,
  appliedAt: true,
  status: { select: { title: true } },
  jobOffer: { select: { companyId: true } },
} as const;

export const APPLICATION_DECISION_CONTEXT_SELECT = {
  id: true,
  userId: true,
  jobOfferId: true,
  status: { select: { title: true } },
} as const;
