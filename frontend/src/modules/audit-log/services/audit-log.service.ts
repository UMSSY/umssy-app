import { apiClient } from "@/shared/services/api-client";
import { AUDIT_PAGE_SIZE } from "../constants/audit-log.constants";
import type { AuditApiResult } from "../types/audit-api-result.types";
import type { AuditEventPage } from "../types/audit-event.types";
import type { AuditLogFilters } from "../types/audit-log-filters.types";
import { GENERIC_ERROR_MESSAGE, isRecord, NETWORK_ERROR_MESSAGE, toAuditFailure } from "../utils/to-audit-failure";

const NO_EVIDENCE_MESSAGE = "Este evento no tiene un documento asociado.";
const EVIDENCE_GONE_MESSAGE = "El documento de este evento ya no está disponible.";

// Solo se envían los filtros con valor
export function toFilterParams(filters: AuditLogFilters): Record<string, string> {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ""));
}

async function listEvents(page: number, filters: AuditLogFilters, limit: number = AUDIT_PAGE_SIZE): Promise<AuditApiResult<AuditEventPage>> {
  try {
    const response = await apiClient.get("/audit-events", {
      params: { page, limit, ...toFilterParams(filters) },
      validateStatus: () => true,
    });
    if (response.status < 200 || response.status >= 300) return toAuditFailure(response.status, response.data);

    const body: unknown = response.data;
    const payload = isRecord(body) && isRecord(body.data) ? body.data : null;
    if (!payload || !Array.isArray(payload.items) || typeof payload.total !== "number") {
      return { ok: false, status: 0, message: GENERIC_ERROR_MESSAGE };
    }
    return {
      ok: true,
      data: {
        items: payload.items as AuditEventPage["items"],
        total: payload.total,
        page: typeof payload.page === "number" ? payload.page : page,
        limit: typeof payload.limit === "number" ? payload.limit : limit,
      },
    };
  } catch {
    return { ok: false, status: 0, message: NETWORK_ERROR_MESSAGE };
  }
}

// Pide el archivo por el identificador del evento, nunca el documento actual de la solicitud
async function getEvidenceBlob(eventId: string): Promise<AuditApiResult<Blob>> {
  try {
    const response = await apiClient.get(`/audit-events/${eventId}/document`, { responseType: "blob", validateStatus: () => true });
    if (response.status === 404) return { ok: false, status: 404, message: NO_EVIDENCE_MESSAGE };
    if (response.status === 410) return { ok: false, status: 410, message: EVIDENCE_GONE_MESSAGE };
    if (response.status < 200 || response.status >= 300) return toAuditFailure(response.status, null);
    if (!(response.data instanceof Blob)) return { ok: false, status: 0, message: GENERIC_ERROR_MESSAGE };
    return { ok: true, data: response.data };
  } catch {
    return { ok: false, status: 0, message: NETWORK_ERROR_MESSAGE };
  }
}

export const auditLogService = { listEvents, getEvidenceBlob };
