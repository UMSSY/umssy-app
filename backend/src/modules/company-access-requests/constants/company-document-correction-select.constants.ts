import type { Prisma } from '../../../prisma/client.js';

export const COMPANY_DOCUMENT_CORRECTION_SELECT = {
  id: true,
  requestCode: true,
  documentFileId: true,
  reviewedAt: true,
  status: { select: { title: true } },
} satisfies Prisma.CompanyAccessRequestSelect;
