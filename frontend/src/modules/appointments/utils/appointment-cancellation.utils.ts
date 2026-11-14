import { APPOINTMENT_CANCELLATION_TEXT } from "../constants/appointments.constants";
import type { Appointment } from "../types/appointment.types";
import type { AppointmentCancellation } from "../types/appointment-cancellation.types";

export function getCancellationLabel(cancellation: AppointmentCancellation | null): string {
  if (!cancellation) return APPOINTMENT_CANCELLATION_TEXT.fallback;
  if (cancellation.cancelledByMe) return APPOINTMENT_CANCELLATION_TEXT.byMe;
  if (cancellation.cancelledBy === "MENTOR") return APPOINTMENT_CANCELLATION_TEXT.byMentor;
  if (cancellation.cancelledBy === "STUDENT") return APPOINTMENT_CANCELLATION_TEXT.byStudent;
  return APPOINTMENT_CANCELLATION_TEXT.fallback;
}

export function canRebookAfterCancellation(appointment: Appointment): boolean {
  return (
    appointment.status === "CANCELLED" &&
    appointment.cancellation?.cancelledBy === "MENTOR" &&
    !appointment.cancellation.cancelledByMe
  );
}
