import type { Prisma } from '../../../prisma/client.js';

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

export const AUDIT_EVENT_ORDER = [{ occurredAt: 'desc' }, { number: 'desc' }] satisfies Prisma.AuditEventOrderByWithRelationInput[];

export const AUDIT_TIMELINE_SELECT = {
  id: true,
  occurredAt: true,
  actorName: true,
  actorRole: true,
  detail: true,
  action: { select: { title: true } },
} satisfies Prisma.AuditEventSelect;

export const AUDIT_TIMELINE_ORDER = [{ occurredAt: 'asc' }, { number: 'asc' }] satisfies Prisma.AuditEventOrderByWithRelationInput[];
