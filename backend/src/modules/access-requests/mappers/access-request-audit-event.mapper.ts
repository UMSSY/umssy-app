import { SYSTEM_ACTOR_NAME } from '../../audit-events/constants/audit-events.constants.js';
import { AUDIT_ACTION } from '../../audit-events/types/audit-action.enum.js';
import { AUDIT_ACTOR_ROLE } from '../../audit-events/types/audit-actor-role.enum.js';
import type { RecordAuditEventInput } from '../../audit-events/types/record-audit-event-input.types.js';
import { DOCUMENT_TYPE_LABELS } from '../constants/document-type-labels.constants.js';
import { maskEmail } from '../helpers/mask-email.js';
import type { AccessRequestAuditSource } from '../types/access-request-audit.types.js';

const ADMINISTRATIVE_FALLBACK_NAME = 'Personal administrativo';

const fullName = (person: { firstName: string; lastName: string }) => `${person.firstName} ${person.lastName}`.trim();

const documentLabel = (source: AccessRequestAuditSource) =>
  source.documentType ? (DOCUMENT_TYPE_LABELS[source.documentType.title] ?? source.documentType.title) : null;

function baseEvent(source: AccessRequestAuditSource) {
  return {
    accessRequestId: source.id,
    requestCode: source.requestCode ?? '',
    applicantName: fullName(source),
    applicantCareer: source.career.title,
    evidenceFileId: source.documentFileId,
  };
}

function reviewer(source: AccessRequestAuditSource, reviewerId: string) {
  return {
    id: reviewerId,
    name: source.reviewedBy ? fullName(source.reviewedBy) : ADMINISTRATIVE_FALLBACK_NAME,
    role: AUDIT_ACTOR_ROLE.ADMINISTRATIVE,
  };
}

export function toSubmittedAuditEvent(source: AccessRequestAuditSource): RecordAuditEventInput {
  const label = documentLabel(source);
  return {
    ...baseEvent(source),
    action: AUDIT_ACTION.SUBMITTED,
    actor: { id: null, name: fullName(source), role: AUDIT_ACTOR_ROLE.GRADUATE },
    detail: label ? `Solicitud enviada con ${label.toLowerCase()} adjunto.` : null,
  };
}

export function toOpenedAuditEvent(source: AccessRequestAuditSource, reviewerId: string): RecordAuditEventInput {
  return {
    ...baseEvent(source),
    action: AUDIT_ACTION.OPENED,
    actor: reviewer(source, reviewerId),
    detail: 'Solicitud abierta y marcada como En revisión.',
  };
}

export function toApprovedAuditEvent(source: AccessRequestAuditSource, reviewerId: string): RecordAuditEventInput {
  const label = documentLabel(source);
  return {
    ...baseEvent(source),
    action: AUDIT_ACTION.APPROVED,
    actor: reviewer(source, reviewerId),
    detail: label ? `Documento revisado: ${label}.` : null,
  };
}

export function toRejectedAuditEvent(source: AccessRequestAuditSource, reviewerId: string, reason: string): RecordAuditEventInput {
  return {
    ...baseEvent(source),
    action: AUDIT_ACTION.REJECTED,
    actor: reviewer(source, reviewerId),
    detail: `Motivo: ${reason}`,
  };
}

const systemActor = () => ({ id: null, name: SYSTEM_ACTOR_NAME, role: AUDIT_ACTOR_ROLE.SYSTEM });

export function toOcrReadAuditEvent(source: AccessRequestAuditSource, matchScore: number): RecordAuditEventInput {
  return {
    ...baseEvent(source),
    action: AUDIT_ACTION.OCR_READ,
    actor: systemActor(),
    detail: `Lectura OCR completada: ${matchScore}% de coincidencia con los datos declarados.`,
  };
}

export function toAutomaticApprovalAuditEvent(source: AccessRequestAuditSource, matchScore: number): RecordAuditEventInput {
  return {
    ...baseEvent(source),
    action: AUDIT_ACTION.APPROVED,
    actor: systemActor(),
    detail: `Aprobada automáticamente con ${matchScore}% de coincidencia.`,
  };
}

export function toAutomaticRejectionAuditEvent(source: AccessRequestAuditSource, reason: string): RecordAuditEventInput {
  return {
    ...baseEvent(source),
    action: AUDIT_ACTION.REJECTED,
    actor: systemActor(),
    detail: `Rechazada automáticamente. Motivo: ${reason}`,
  };
}

export function toManualReviewAuditEvent(source: AccessRequestAuditSource, reason: string): RecordAuditEventInput {
  return {
    ...baseEvent(source),
    action: AUDIT_ACTION.SENT_TO_MANUAL_REVIEW,
    actor: systemActor(),
    detail: `Motivo: ${reason}`,
  };
}

export function toApprovalRevertedAuditEvent(source: AccessRequestAuditSource, adminId: string): RecordAuditEventInput {
  return {
    ...baseEvent(source),
    action: AUDIT_ACTION.APPROVAL_REVERTED,
    actor: reviewer(source, adminId),
    detail: 'La aprobación automática se revirtió y la solicitud volvió a revisión manual.',
  };
}

export function toActivationCodeSentAuditEvent(source: AccessRequestAuditSource, email: string): RecordAuditEventInput {
  return {
    ...baseEvent(source),
    evidenceFileId: null,
    action: AUDIT_ACTION.ACTIVATION_CODE_SENT,
    actor: { id: null, name: SYSTEM_ACTOR_NAME, role: AUDIT_ACTOR_ROLE.SYSTEM },
    detail: `Código de activación enviado a ${maskEmail(email)}.`,
  };
}
