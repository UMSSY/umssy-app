import type { Prisma } from '../../../prisma/client.js';

// Datos de la solicitud que se copian al evento de auditoría en el momento del cambio
export const ACCESS_REQUEST_AUDIT_SELECT = {
  id: true,
  requestCode: true,
  firstName: true,
  lastName: true,
  documentFileId: true,
  career: { select: { title: true } },
  documentType: { select: { title: true } },
  reviewedBy: { select: { firstName: true, lastName: true } },
} satisfies Prisma.AccessRequestSelect;
