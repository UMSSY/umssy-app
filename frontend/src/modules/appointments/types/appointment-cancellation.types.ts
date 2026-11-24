import type { AppointmentCanceller } from "./appointment-canceller.types";

export interface AppointmentCancellation {
  cancelledBy: AppointmentCanceller | null;
  cancelledByMe: boolean;
  reason: string | null;
  cancelledAt: string | null;
}
