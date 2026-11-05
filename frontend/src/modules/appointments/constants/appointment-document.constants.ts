export const APPOINTMENT_DOCUMENT_FIELD_NAME = "file";

export const getAppointmentDocumentEndpoint = (appointmentId: string) =>
  `/appointments/${appointmentId}/document`;
