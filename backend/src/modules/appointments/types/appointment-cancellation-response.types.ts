import type { AppointmentCanceller } from './appointment-canceller.types.js';

export interface AppointmentCancellationResponse {
  cancelledBy: AppointmentCanceller | null;
  cancelledByMe: boolean;
  reason: string | null;
  cancelledAt: string | null;
}
