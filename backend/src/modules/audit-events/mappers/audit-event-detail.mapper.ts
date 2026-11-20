import type { Prisma } from '../../../prisma/client.js';
import type { AUDIT_EVENT_DETAIL_SELECT } from '../constants/audit-event-selects.constants.js';
import { buildAuditEventCode } from '../helpers/build-audit-event-code.js';
import { readRejectionReason } from '../helpers/read-rejection-reason.js';
import type { AuditActionName } from '../types/audit-action.enum.js';
import type { AuditEventDetailResponse } from '../types/audit-event-detail-response.types.js';
import type { AuditEventApplicantDetails } from '../types/audit-event-applicant-details.types.js';
import { toAuditResponsible } from './audit-event.mapper.js';

type AuditEventDetailRow = Prisma.AuditEventGetPayload<{
  select: typeof AUDIT_EVENT_DETAIL_SELECT;
}>;

export function toAuditEventDetail(
  row: AuditEventDetailRow,
  applicantDetails?: AuditEventApplicantDetails | null,
): AuditEventDetailResponse {
  const action = row.action.title as AuditActionName;
  const { evidenceFile } = row;
  const details =
    applicantDetails ??
    (row as { accessRequest?: AuditEventApplicantDetails | null })
      .accessRequest ??
    null;

  return {
    id: row.id,
    code: buildAuditEventCode(row.number, row.occurredAt),
    occurredAt: row.occurredAt.toISOString(),
    action,
    request: { id: row.accessRequestId, code: row.requestCode },
    applicant: {
      fullName: row.applicantName,
      career: row.applicantCareer,
      graduationYear: details?.graduationYear ?? 0,
    },
    responsible: toAuditResponsible(row),
    rejectionReason: readRejectionReason(action, row.detail),
    documentType: details?.documentType?.title ?? null,
    evidence: evidenceFile
      ? {
          name: evidenceFile.name,
          extension: evidenceFile.extension,
          mimeType: evidenceFile.mimeType,
          size: evidenceFile.size,
        }
      : null,
  };
}
