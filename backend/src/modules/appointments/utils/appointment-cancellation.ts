import { APPOINTMENT_CANCELLER } from '../constants/appointment-canceller.constants.js';
import type { AppointmentCancellationResponse } from '../types/appointment-cancellation-response.types.js';
import type { AppointmentCanceller } from '../types/appointment-canceller.types.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';

type CancelledAppointment = Pick<
  AppointmentRecord,
  | 'mentorId'
  | 'studentId'
  | 'cancelledById'
  | 'cancellationReason'
  | 'cancelledAt'
>;

const resolveCanceller = (
  appointment: CancelledAppointment,
): AppointmentCanceller | null => {
  if (appointment.cancelledById === null) {
    return null;
  }
  if (appointment.cancelledById === appointment.mentorId) {
    return APPOINTMENT_CANCELLER.mentor;
  }
  if (appointment.cancelledById === appointment.studentId) {
    return APPOINTMENT_CANCELLER.student;
  }
  return null;
};

export const buildAppointmentCancellation = (
  appointment: CancelledAppointment,
  userId: string,
): AppointmentCancellationResponse => ({
  cancelledBy: resolveCanceller(appointment),
  cancelledByMe: appointment.cancelledById === userId,
  reason: appointment.cancellationReason?.trim() || null,
  cancelledAt: appointment.cancelledAt?.toISOString() ?? null,
});
