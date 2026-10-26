import type { Prisma } from '../../../prisma/client.js';

// Nunca incluye el contenido binario del documento
export const AUDIT_EVIDENCE_SELECT = {
  select: { name: true, extension: true, mimeType: true, size: true },
} satisfies Prisma.FileDefaultArgs;

export const AUDIT_EVENT_LIST_SELECT = {
  id: true,
  number: true,
  occurredAt: true,
  accessRequestId: true,
  requestCode: true,
  applicantName: true,
  actorId: true,
  actorName: true,
  actorRole: true,
  detail: true,
  action: { select: { title: true } },
  evidenceFile: AUDIT_EVIDENCE_SELECT,
} satisfies Prisma.AuditEventSelect;

// Orden estable: el número correlativo desempata eventos del mismo instante
export const AUDIT_EVENT_ORDER = [{ occurredAt: 'desc' }, { number: 'desc' }] satisfies Prisma.AuditEventOrderByWithRelationInput[];
