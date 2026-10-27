import { readRecord, readString } from '@/shared/utils/response-validation';
import type { Registration } from "../types/registration.types";

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

export { readArray } from '@/shared/utils/response-validation';
