import type { Prisma } from '../../../prisma/client.js';
import { ACCESS_REQUEST_AUDIT_SELECT } from './access-request-audit-select.constants.js';

export const DOCUMENT_CORRECTION_SELECT = {
  ...ACCESS_REQUEST_AUDIT_SELECT,
  status: { select: { title: true } },
  updatedAt: true,
} satisfies Prisma.AccessRequestSelect;
