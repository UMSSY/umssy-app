export interface CancelAppointmentData {
  statusId: string;
  cancelledById: string;
  cancelledAt: Date;
  cancellationReason: string | null;
}
