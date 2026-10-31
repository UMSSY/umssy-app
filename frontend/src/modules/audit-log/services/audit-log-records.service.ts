import { apiClient } from "@/shared/services/api-client";
import { CSV_FALLBACK_FILE_NAME } from "../constants/audit-log-filters.constants";
import type { AuditApiResult } from "../types/audit-api-result.types";
import type { AuditCsvFile, AuditResponsibleOption } from "../types/audit-log-records.types";
import type { AuditLogFilters } from "../types/audit-log-filters.types";
import { GENERIC_ERROR_MESSAGE, isRecord, NETWORK_ERROR_MESSAGE, toAuditFailure } from "../utils/to-audit-failure";
import { toFilterParams } from "./audit-log.service";

async function listResponsibles(): Promise<AuditApiResult<AuditResponsibleOption[]>> {
  try {
    const response = await apiClient.get("/audit-events/responsibles", { validateStatus: () => true });
    if (response.status < 200 || response.status >= 300) return toAuditFailure(response.status, response.data);
    const body: unknown = response.data;
    const items = isRecord(body) && Array.isArray(body.data) ? body.data : null;
    if (!items) return { ok: false, status: 0, message: GENERIC_ERROR_MESSAGE };
    return { ok: true, data: items as AuditResponsibleOption[] };
  } catch {
    return { ok: false, status: 0, message: NETWORK_ERROR_MESSAGE };
  }
}

function readFileName(disposition: unknown): string {
  if (typeof disposition !== "string") return CSV_FALLBACK_FILE_NAME;
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  return match?.[1] ?? CSV_FALLBACK_FILE_NAME;
}

async function readErrorBody(data: unknown): Promise<unknown> {
  if (!(data instanceof Blob)) return data;
  try {
    return JSON.parse(await data.text());
  } catch {
    return null;
  }
}

// Envía exactamente los filtros del listado; una respuesta de error nunca se entrega como CSV
async function exportCsv(filters: AuditLogFilters): Promise<AuditApiResult<AuditCsvFile>> {
  try {
    const response = await apiClient.get("/audit-events/export", {
      params: toFilterParams(filters),
      responseType: "blob",
      validateStatus: () => true,
    });
    if (response.status < 200 || response.status >= 300) return toAuditFailure(response.status, await readErrorBody(response.data));
    const contentType = String(response.headers?.["content-type"] ?? "");
    if (!(response.data instanceof Blob) || !contentType.includes("text/csv")) {
      return { ok: false, status: 0, message: GENERIC_ERROR_MESSAGE };
    }
    return { ok: true, data: { blob: response.data, fileName: readFileName(response.headers?.["content-disposition"]) } };
  } catch {
    return { ok: false, status: 0, message: NETWORK_ERROR_MESSAGE };
  }
}

export const auditLogRecordsService = { listResponsibles, exportCsv };
