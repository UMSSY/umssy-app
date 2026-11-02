import type { AppointmentCounterpartResponse } from './appointment-counterpart-response.types.js';
import type { AppointmentOrientationResponse } from './appointment-orientation-response.types.js';

export interface MyAppointmentResponse {
  id: string;
  blockId: string | null;
  startAt: string;
  endAt: string;
  orientationType: AppointmentOrientationResponse | null;
  counterpart: AppointmentCounterpartResponse;
  status: string;
}
