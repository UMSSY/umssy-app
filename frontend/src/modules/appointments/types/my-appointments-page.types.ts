import type { Appointment } from "./appointment.types";

export interface MyAppointmentsPage {
  items: Appointment[];
  total: number;
  page: number;
  pageSize: number;
}
