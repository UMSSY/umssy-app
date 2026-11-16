import type { AppointmentScope } from "./appointment-scope.types";

export interface MyAppointmentsQueryParams {
  scope: AppointmentScope;
  page: number;
}
