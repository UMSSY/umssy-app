import { CREDENTIAL_LIMIT_OPERATIONS } from "../constants/credential-limit.constants";
import { AuthRequestError } from "../errors/auth-request.error";
import type { CredentialLimit } from "../types/credential-limit.types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function positiveSeconds(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
}

export function getCredentialLimit(cause: unknown): CredentialLimit | null {
  if (cause instanceof AuthRequestError) return cause.credentialLimit;
  const response = asRecord(asRecord(cause)?.response);
  if (response?.status !== 429) return null;

  const body = asRecord(response.data);
  const code = body?.code;
  if (typeof code !== "string" || !Object.hasOwn(CREDENTIAL_LIMIT_OPERATIONS, code)) return null;
  const operation = CREDENTIAL_LIMIT_OPERATIONS[code];
  const data = asRecord(body?.data);
  if (data?.operation !== undefined && data.operation !== operation) return null;

  const headers = asRecord(response.headers);
  const retryHeader = headers?.["retry-after"] ?? headers?.["Retry-After"];
  const relativeSeconds = positiveSeconds(retryHeader) ?? positiveSeconds(data?.retryAfterSeconds);
  const absoluteTime = typeof data?.retryAt === "string" ? Date.parse(data.retryAt) : NaN;
  const retryAfterSeconds = relativeSeconds ?? positiveSeconds((absoluteTime - Date.now()) / 1000);
  if (retryAfterSeconds === null) return null;

  // Se prioriza la espera relativa para evitar diferencias entre los relojes del cliente y el servidor.
  const retryAt = Date.now() + retryAfterSeconds * 1000;
  if (!Number.isFinite(new Date(retryAt).getTime())) return null;
  return { code, operation, retryAfterSeconds, retryAt };
}

export function toAuthRequestError(cause: unknown, fallback: string): AuthRequestError {
  if (cause instanceof AuthRequestError) return cause;
  const response = asRecord(asRecord(cause)?.response);
  const body = asRecord(response?.data);
  const detail = typeof body?.detail === "string" && body.detail.trim() ? body.detail : null;
  return new AuthRequestError(
    detail ?? (cause instanceof Error && cause.message ? cause.message : fallback),
    {
      status: typeof response?.status === "number" ? response.status : undefined,
      code: typeof body?.code === "string" ? body.code : undefined,
      credentialLimit: getCredentialLimit(cause),
    },
  );
}
