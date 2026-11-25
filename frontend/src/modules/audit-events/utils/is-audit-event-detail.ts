import {
  AUDIT_ACTION_STYLES,
  AUDIT_ROLE_LABELS,
} from "../constants/audit-actions.constants";
import type { AuditAction } from "../types/audit-action.types";
import type { AuditActorRole } from "../types/audit-actor-role.types";
import type { AuditEventDetail } from "../types/audit-event-detail.types";
import { isRecord } from "./to-audit-failure";

function isAuditAction(value: unknown): value is AuditAction {
  return typeof value === "string" && Object.hasOwn(AUDIT_ACTION_STYLES, value);
}

function isAuditActorRole(value: unknown): value is AuditActorRole {
  return typeof value === "string" && Object.hasOwn(AUDIT_ROLE_LABELS, value);
}

export function isAuditEventDetail(val: unknown): val is AuditEventDetail {
  if (!isRecord(val)) return false;

  if (
    typeof val.id !== "string" ||
    typeof val.code !== "string" ||
    typeof val.occurredAt !== "string" ||
    !isAuditAction(val.action)
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
    !isAuditActorRole(val.responsible.role)
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
