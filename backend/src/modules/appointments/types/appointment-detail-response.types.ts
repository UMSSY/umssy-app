import type { MyAppointmentResponse } from './my-appointment-response.types.js';

export interface AppointmentDetailResponse extends MyAppointmentResponse {
  meetingUrl: string | null;
}
