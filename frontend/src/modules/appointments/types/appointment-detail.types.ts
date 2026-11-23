import type { Appointment } from "./appointment.types";

export interface AppointmentDetail extends Appointment {
  meetingUrl: string | null;
}
