export interface CreateAppointmentHistoryData {
  appointmentId: string;
  previousStatusId: string | null;
  newStatusId: string;
  changedById: string;
}
