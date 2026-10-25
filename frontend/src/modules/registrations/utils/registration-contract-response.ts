import { DEFAULT_REGISTRATION_ERROR_MESSAGE } from "../constants/registration-errors.constants";
import type { RegistrationResponse } from "../types/registration-response.types";

function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("La respuesta del backend no es válida.");
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("La respuesta del backend no es válida.");
  }
  return value;
}

export function parseRegistrationResponse(value: unknown, statusCode: 200 | 201): RegistrationResponse {
  const body = readRecord(value);
  const data = readRecord(body.data);
  const status = data.status;
  if (body.ok !== true || body.statusCode !== statusCode || (status !== "confirmed" && status !== "cancelled")) {
    throw new Error(DEFAULT_REGISTRATION_ERROR_MESSAGE);
  }
  const registeredAt = readString(data.registeredAt);
  const cancelledAt = data.cancelledAt === null ? null : readString(data.cancelledAt);
  if (
    !Number.isFinite(Date.parse(registeredAt)) ||
    (cancelledAt !== null && !Number.isFinite(Date.parse(cancelledAt))) ||
    (data.status === "confirmed") !== (cancelledAt === null)
  ) {
    throw new Error(DEFAULT_REGISTRATION_ERROR_MESSAGE);
  }
  return {
    id: readString(data.id),
    eventId: readString(data.eventId),
    status,
    qrToken: readString(data.qrToken),
    registeredAt,
    cancelledAt,
  };
}
