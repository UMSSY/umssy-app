import type { MyAppointmentResponse } from './my-appointment-response.types.js';

export interface MyAppointmentsPageResponse {
  items: MyAppointmentResponse[];
  total: number;
  page: number;
  pageSize: number;
}
