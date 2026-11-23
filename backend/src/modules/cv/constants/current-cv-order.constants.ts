export const CURRENT_CV_ORDER = [
  { cvUploadedAt: { sort: 'desc', nulls: 'last' } },
  { createdAt: 'desc' },
  { id: 'desc' },
] as const;
