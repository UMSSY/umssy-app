import type { Prisma } from '../../../prisma/client.js';

export interface AccessRequestAuditSource {
  id: string;
  requestCode: string | null;
  firstName: string;
  lastName: string;
  documentFileId: string | null;
  career: { title: string };
  documentType: { title: string } | null;
  reviewedBy?: { firstName: string; lastName: string } | null;
}

// Se ejecuta dentro de la transacción del cambio: si falla, el cambio también se revierte
export type AccessRequestAuditHook = (source: AccessRequestAuditSource, tx: Prisma.TransactionClient) => Promise<unknown>;
