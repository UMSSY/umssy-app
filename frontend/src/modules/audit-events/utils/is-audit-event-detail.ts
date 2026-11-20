import type { AuditEventDetail } from "../types/audit-event-detail.types";
import { isRecord } from "./to-audit-failure";

export function isAuditEventDetail(val: unknown): val is AuditEventDetail {
  if (!isRecord(val)) return false;

  if (
    typeof val.id !== "string" ||
    typeof val.code !== "string" ||
    typeof val.occurredAt !== "string" ||
    typeof val.action !== "string"
  ) {
    return false;
  }

  if (
    !isRecord(val.request) ||
    typeof val.request.id !== "string" ||
    typeof val.request.code !== "string"
  ) {
    return false;
  }

  if (
    !isRecord(val.applicant) ||
    typeof val.applicant.fullName !== "string" ||
    typeof val.applicant.career !== "string" ||
    typeof val.applicant.graduationYear !== "number"
  ) {
    return false;
  }

  if (
    !isRecord(val.responsible) ||
    (val.responsible.id !== null && typeof val.responsible.id !== "string") ||
    typeof val.responsible.name !== "string" ||
    typeof val.responsible.role !== "string"
  ) {
    return false;
  }

  if (val.rejectionReason !== null && typeof val.rejectionReason !== "string") {
    return false;
  }

  if (val.documentType !== null && typeof val.documentType !== "string") {
    return false;
  }

  if (val.evidence !== null) {
    if (
      !isRecord(val.evidence) ||
      typeof val.evidence.name !== "string" ||
      typeof val.evidence.extension !== "string" ||
      typeof val.evidence.mimeType !== "string" ||
      typeof val.evidence.size !== "number"
    ) {
      return false;
    }
  }

  return true;
}
