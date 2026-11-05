export const APPOINTMENT_DOCUMENT_FIELD_NAME = "file";

export const getAppointmentEndpoint = (appointmentId: string) => `/appointments/${appointmentId}`;

export const getCounterpartPhotoEndpoint = (appointmentId: string) =>
  `/appointments/${appointmentId}/counterpart-photo`;

export const getAppointmentDocumentEndpoint = (appointmentId: string) =>
  `/appointments/${appointmentId}/document`;
