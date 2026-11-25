import { GENERIC_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE } from "@/shared/constants/error-messages.constants";
import { apiClient } from "@/shared/services/api-client";
import { AUDIT_PAGE_SIZE } from "../constants/audit-log.constants";
import type { AuditApiResult } from "../types/audit-api-result.types";
import type { AuditEventDetail } from "../types/audit-event-detail.types";
import type { AuditEventPage } from "../types/audit-event-page.types";
import type { AuditEventTimeline } from "../types/audit-event-timeline.types";
import type { AuditLogFilters } from "../types/audit-log-filters.types";
import { isAuditEventDetail } from "../utils/is-audit-event-detail";
import { isRecord, toAuditFailure } from "../utils/to-audit-failure";

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
    const response = await apiClient.get(`/audit-events/${eventId}/document`, {
      responseType: "blob",
      validateStatus: () => true,
    });
    if (response.status === 404) return { ok: false, status: 404, message: NO_EVIDENCE_MESSAGE };
    if (response.status === 410) return { ok: false, status: 410, message: EVIDENCE_GONE_MESSAGE };
    if (response.status < 200 || response.status >= 300) return toAuditFailure(response.status, null);
    if (!(response.data instanceof Blob)) return { ok: false, status: 0, message: GENERIC_ERROR_MESSAGE };
    return { ok: true, data: response.data };
  } catch {
    return { ok: false, status: 0, message: NETWORK_ERROR_MESSAGE };
  }
}

async function getEventDetail(eventId: string): Promise<AuditApiResult<AuditEventDetail>> {
  try {
    const response = await apiClient.get(`/audit-events/${eventId}`, { validateStatus: () => true });
    if (response.status < 200 || response.status >= 300) return toAuditFailure(response.status, response.data);

    const body: unknown = response.data;
    const payload = isRecord(body) && isRecord(body.data) ? body.data : null;
    if (!isAuditEventDetail(payload)) {
      return { ok: false, status: 0, message: GENERIC_ERROR_MESSAGE };
    }
    return { ok: true, data: payload };
  } catch {
    return { ok: false, status: 0, message: NETWORK_ERROR_MESSAGE };
  }
}

async function getEventTimeline(eventId: string): Promise<AuditApiResult<AuditEventTimeline>> {
  try {
    const response = await apiClient.get(`/audit-events/${eventId}/timeline`, { validateStatus: () => true });
    if (response.status < 200 || response.status >= 300) return toAuditFailure(response.status, response.data);

    const body: unknown = response.data;
    const payload = isRecord(body) && isRecord(body.data) ? body.data : null;
    if (!payload || !Array.isArray(payload.items) || typeof payload.requestCode !== "string") {
      return { ok: false, status: 0, message: GENERIC_ERROR_MESSAGE };
    }
    return {
      ok: true,
      data: {
        requestCode: payload.requestCode,
        focusedEventId: typeof payload.focusedEventId === "string" ? payload.focusedEventId : eventId,
        items: payload.items as AuditEventTimeline["items"],
      },
    };
  } catch {
    return { ok: false, status: 0, message: NETWORK_ERROR_MESSAGE };
  }
}

export const auditLogService = { listEvents, getEventDetail, getEventTimeline, getEvidenceBlob };
