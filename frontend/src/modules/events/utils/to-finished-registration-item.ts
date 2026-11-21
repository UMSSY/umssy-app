import type { Registration } from "@/modules/event-registrations";
import type { FinishedRegistrationItem } from "../types/finished-registration-item.types";

export function toFinishedRegistrationItem(registration: Registration): FinishedRegistrationItem {
  return {
    id: registration.id,
    title: registration.eventName,
    date: registration.date,
    startTime: registration.startTime,
    endTime: registration.endTime,
    location: registration.location ?? null,
    ...(registration.sessions && { sessions: registration.sessions }),
  };
}
