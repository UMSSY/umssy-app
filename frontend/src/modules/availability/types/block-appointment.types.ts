import type { AppointmentCounterpart, AppointmentOrientationType } from "@/modules/appointments";

export interface BlockAppointment {
  id: string;
  counterpart: AppointmentCounterpart;
  orientationType: AppointmentOrientationType | null;
}
