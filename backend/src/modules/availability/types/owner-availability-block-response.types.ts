import type { AvailabilityBlockResponse } from './availability-block-response.types.js';
import type { BlockAppointmentResponse } from './block-appointment-response.types.js';

export interface OwnerAvailabilityBlockResponse extends AvailabilityBlockResponse {
  appointment: BlockAppointmentResponse | null;
}
