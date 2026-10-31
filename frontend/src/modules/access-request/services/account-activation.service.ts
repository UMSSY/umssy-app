import { ROLE_TAGS } from "@/shared/constants/roles.constants";
import { apiClient } from "@/shared/services/api-client";
import {
  ACTIVATION_GENERIC_MESSAGE,
  ACTIVATION_NETWORK_MESSAGE,
} from "../constants/account-activation.constants";
import type {
  ActivationFailure,
  ActivationReason,
  ActivationResend,
  ActivationResult,
  ActivationSession,
  ActivationState,
  ActivationStatus,
} from "../types/account-activation.types";

const STATES: ActivationState[] = ["no_code", "ready", "expired", "locked", "activated"];
const REASONS: ActivationReason[] = [
  "not_found",
  "already_activated",
  "code_invalid",
  "code_expired",
  "attempts_exceeded",
  "resend_cooldown",
  "resend_limit",
  "code_not_sent",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrap(body: unknown): unknown {
  return isRecord(body) && typeof body.statusCode === "number" && "ok" in body && "data" in body ? body.data : body;
}

function failure(status: number, message: string, extra: Partial<ActivationFailure> = {}): ActivationFailure {
  return { ok: false, status, message, fieldErrors: {}, ...extra };
}

function parseError(status: number, body: unknown): ActivationFailure {
  if (!isRecord(body)) return failure(0, ACTIVATION_NETWORK_MESSAGE);
  const detail = typeof body.detail === "string" ? body.detail : ACTIVATION_GENERIC_MESSAGE;
  const data = isRecord(body.data) ? body.data : {};
  const reason = REASONS.find((item) => item === data.reason);

  if (Array.isArray(body.errors)) {
    const fieldErrors: ActivationFailure["fieldErrors"] = {};
    for (const error of body.errors) {
      if (!isRecord(error) || typeof error.message !== "string") continue;
      if (error.field === "code") fieldErrors.code ??= error.message;
      if (error.field === "password") fieldErrors.password ??= error.message;
    }
    return failure(status, detail, { fieldErrors });
  }

  return failure(status, detail, {
    ...(reason && { reason }),
    ...(typeof data.remainingAttempts === "number" && { remainingAttempts: data.remainingAttempts }),
    ...(typeof data.retryAfterSeconds === "number" && { retryAfterSeconds: data.retryAfterSeconds }),
  });
}

async function request<T>(
  method: "get" | "post",
  url: string,
  options: { data?: unknown; params?: Record<string, string> },
  parse: (body: Record<string, unknown>) => T | null,
): Promise<ActivationResult<T>> {
  try {
    const response = await apiClient.request({
      method,
      url,
      data: options.data,
      params: options.params,
      validateStatus: () => true,
    });
    if (response.status >= 200 && response.status < 300) {
      const body = unwrap(response.data);
      const parsed = isRecord(body) ? parse(body) : null;
      return parsed === null ? failure(0, ACTIVATION_GENERIC_MESSAGE) : { ok: true, data: parsed };
    }
    return parseError(response.status, response.data);
  } catch {
    return failure(0, ACTIVATION_NETWORK_MESSAGE);
  }
}

function parseStatus(body: Record<string, unknown>): ActivationStatus | null {
  const state = STATES.find((item) => item === body.state);
  if (!state || typeof body.serverTime !== "string") return null;
  return {
    state,
    serverTime: body.serverTime,
    expiresAt: typeof body.expiresAt === "string" ? body.expiresAt : null,
    resendAvailableAt: typeof body.resendAvailableAt === "string" ? body.resendAvailableAt : null,
    resendsRemaining: typeof body.resendsRemaining === "number" ? body.resendsRemaining : 0,
    remainingAttempts: typeof body.remainingAttempts === "number" ? body.remainingAttempts : 0,
  };
}

function parseResend(body: Record<string, unknown>): ActivationResend | null {
  const { serverTime, expiresAt, resendAvailableAt, resendsRemaining } = body;
  if (typeof serverTime !== "string" || typeof expiresAt !== "string" || typeof resendAvailableAt !== "string") {
    return null;
  }
  return { serverTime, expiresAt, resendAvailableAt, resendsRemaining: typeof resendsRemaining === "number" ? resendsRemaining : 0 };
}

function parseSession(body: Record<string, unknown>): ActivationSession | null {
  const { accessToken, roleTag, roles } = body;
  if (typeof accessToken !== "string" || accessToken === "" || !ROLE_TAGS.some((tag) => tag === roleTag)) return null;
  return {
    accessToken,
    roleTag,
    ...(Array.isArray(roles) && roles.length > 0 ? { roles } : {}),
  } as ActivationSession;
}

export const accountActivationService = {
  getStatus: (email: string) =>
    request("get", "/account-activation/status", { params: { email } }, parseStatus),
  verifyCode: (email: string, code: string) =>
    request("post", "/account-activation/verify", { data: { email, code } }, () => ({})),
  activate: (email: string, code: string, password: string) =>
    request("post", "/account-activation", { data: { email, code, password } }, parseSession),
  resend: (email: string) =>
    request("post", "/account-activation/resend", { data: { email } }, parseResend),
};
