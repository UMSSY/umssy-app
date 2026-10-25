import { isApiError } from "../services/api-client";
import type { ApiErrorResponse } from "../types/api-error-response.types";

export function parseApiError(error: unknown): ApiErrorResponse | null {
  if (!isApiError<unknown>(error)) return null;
  const body = error.response?.data;
  if (typeof body !== "object" || body === null) return null;
  if (!("statusCode" in body) || typeof body.statusCode !== "number" || !Number.isInteger(body.statusCode) || body.statusCode < 400 || body.statusCode > 599 || body.statusCode !== error.response?.status) return null;
  if (!("ok" in body) || body.ok !== false || !("data" in body) || body.data !== null) return null;
  if (!("code" in body) || typeof body.code !== "string" || body.code.trim().length === 0) return null;
  if (!("detail" in body) || typeof body.detail !== "string") return null;
  return { statusCode: body.statusCode, ok: false, code: body.code, detail: body.detail, data: null };
}
