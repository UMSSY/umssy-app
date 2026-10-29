import type { AppointmentCounterpartResponse } from '../../appointments/types/appointment-counterpart-response.types.js';
import type { AppointmentOrientationResponse } from '../../appointments/types/appointment-orientation-response.types.js';

export interface BlockAppointmentResponse {
  id: string;
  counterpart: AppointmentCounterpartResponse;
  orientationType: AppointmentOrientationResponse | null;
}
