import { isApiError as isAxiosError } from "@/shared/services/api-client";
import { EDIT_MESSAGES, PUBLISH_MESSAGES } from "../constants/job-offers.constants";
import type { PublishError } from "../types/publish-error.types";
import type { PublishMode } from "../types/publish-mode.types";

interface ErrorBody {
  data?: unknown;
  detail?: unknown;
}

function readValidationMessages(data: unknown): string[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => (item as { message?: unknown }).message)
    .filter((message): message is string => typeof message === "string" && message.length > 0);
}

function readDetails(body: ErrorBody | undefined): string[] {
  const messages = readValidationMessages(body?.data);
  if (messages.length > 0) return messages;
  return typeof body?.detail === "string" && body.detail.length > 0 ? [body.detail] : [];
}

export function toPublishError(error: unknown, mode: PublishMode = "publish"): PublishError {
  // En la edición un corte de red y un error del servidor comparten el mensaje acordado con QA.
  const isEdit = mode === "edit";
  const serverMessage = isEdit ? EDIT_MESSAGES.error : PUBLISH_MESSAGES.server;
  const networkMessage = isEdit ? EDIT_MESSAGES.error : PUBLISH_MESSAGES.network;
  if (!isAxiosError(error)) {
    return { kind: "server", message: serverMessage, details: [] };
  }
  if (!error.response) {
    return { kind: "network", message: networkMessage, details: [] };
  }

  const { status, data } = error.response;
  if (status === 400 || status === 422) {
    return { kind: "validation", message: PUBLISH_MESSAGES.validation, details: readDetails(data as ErrorBody) };
  }
  if (status === 404) {
    return { kind: "company", message: PUBLISH_MESSAGES.company, details: [] };
  }
  if (status === 401 || status === 403) {
    return { kind: "session", message: PUBLISH_MESSAGES.session, details: [] };
  }
  return { kind: "server", message: serverMessage, details: [] };
}
