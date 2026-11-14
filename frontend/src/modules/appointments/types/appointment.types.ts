import type { AppointmentCancellation } from "./appointment-cancellation.types";
import type { AppointmentCounterpart } from "./appointment-counterpart.types";
import type { AppointmentDocument } from "./appointment-document.types";
import type { AppointmentOrientationType } from "./appointment-orientation-type.types";
import type { AppointmentStatus } from "./appointment-status.types";

export interface Appointment {
  id: string;
  blockId: string | null;
  startAt: string;
  endAt: string;
  orientationType: AppointmentOrientationType | null;
  counterpart: AppointmentCounterpart;
  status: AppointmentStatus;
  message: string | null;
  requestedAt: string;
  document: AppointmentDocument | null;
  cancellation: AppointmentCancellation | null;
}
