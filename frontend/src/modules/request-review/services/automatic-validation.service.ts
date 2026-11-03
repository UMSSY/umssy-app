import { apiClient } from "@/shared/services/api-client";
import type { AutomationSummary, TimelineItem } from "../types/automatic-validation.types";
import type { ReviewApiResult } from "../types/request-review.types";
import { authHeaders, failureOf } from "./request-review.service";

const NETWORK_ERROR_MESSAGE = "No se pudo conectar con el servidor. Inténtalo de nuevo.";
const GENERIC_ERROR_MESSAGE = "No se pudo completar la operación. Inténtalo de nuevo.";
const NOT_FOUND_MESSAGE = "La solicitud no existe.";
const SUMMARY_KEYS = ["manualReviewCount", "autoApprovedTodayCount", "autoRejectedTodayCount", "receivedTodayCount"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const dataOf = (body: unknown) => (isRecord(body) && "data" in body ? body.data : body);

async function getAutomationSummary(): Promise<ReviewApiResult<AutomationSummary>> {
  try {
    const response = await apiClient.get("/access-requests/automation-summary", { headers: authHeaders(), validateStatus: () => true });
    if (response.status < 200 || response.status >= 300) return failureOf(response.status, response.data);
    const payload = dataOf(response.data);
    if (!isRecord(payload) || SUMMARY_KEYS.some((key) => typeof payload[key] !== "number")) {
      return { ok: false, status: 0, message: GENERIC_ERROR_MESSAGE };
    }
    return { ok: true, data: payload as unknown as AutomationSummary };
  } catch {
    return { ok: false, status: 0, message: NETWORK_ERROR_MESSAGE };
  }
}

async function getRequestHistory(id: string): Promise<ReviewApiResult<TimelineItem[]>> {
  try {
    const response = await apiClient.get(`/access-requests/${id}/history`, { headers: authHeaders(), validateStatus: () => true });
    if (response.status < 200 || response.status >= 300) return failureOf(response.status, response.data);
    const payload = dataOf(response.data);
    if (!Array.isArray(payload)) return { ok: false, status: 0, message: GENERIC_ERROR_MESSAGE };
    return { ok: true, data: payload as TimelineItem[] };
  } catch {
    return { ok: false, status: 0, message: NETWORK_ERROR_MESSAGE };
  }
}

async function revertApproval(id: string): Promise<ReviewApiResult<{ id: string; status: "in_review" }>> {
  try {
    const response = await apiClient.patch(`/access-requests/${id}/revert-approval`, undefined, {
      headers: authHeaders(),
      validateStatus: () => true,
    });
    if (response.status === 404) return { ok: false, status: 404, message: NOT_FOUND_MESSAGE };
    if (response.status < 200 || response.status >= 300) return failureOf(response.status, response.data);
    const payload = dataOf(response.data);
    if (!isRecord(payload) || payload.status !== "in_review") return { ok: false, status: 0, message: GENERIC_ERROR_MESSAGE };
    return { ok: true, data: { id, status: "in_review" } };
  } catch {
    return { ok: false, status: 0, message: NETWORK_ERROR_MESSAGE };
  }
}

export const automaticValidationService = { getAutomationSummary, getRequestHistory, revertApproval };
