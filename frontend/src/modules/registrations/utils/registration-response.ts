import type { Registration } from "../types/registration.types";

function invalidResponse(): never {
  throw new Error("La respuesta del backend no es válida.");
}

function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalidResponse();
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  if (typeof value !== "string") invalidResponse();
  return value;
}

export function readArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) invalidResponse();
  return value;
}

export function parseRegistration(value: unknown): Registration {
  const registration = readRecord(value);
  const parsed: Registration = {
    id: readString(registration.id),
    eventName: readString(registration.eventName),
    date: readString(registration.date),
    startTime: readString(registration.startTime),
    endTime: readString(registration.endTime),
    location: readString(registration.location),
    status: readString(registration.status),
  };
  if (typeof registration.registeredAt === "string") {
    parsed.registeredAt = registration.registeredAt;
  }
  if (typeof registration.cancelledAt === "string" || registration.cancelledAt === null) {
    parsed.cancelledAt = registration.cancelledAt as string | null;
  }
  return parsed;
}
