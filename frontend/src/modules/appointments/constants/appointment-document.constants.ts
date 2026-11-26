export const getAppointmentEndpoint = (appointmentId: string) => `/appointments/${appointmentId}`;

export const getCounterpartPhotoEndpoint = (appointmentId: string) =>
  `/appointments/${appointmentId}/counterpart-photo`;

export const getAppointmentDocumentEndpoint = (appointmentId: string) =>
  `/appointments/${appointmentId}/document`;

export const APPOINTMENT_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPG",
};

export const APPOINTMENT_DOCUMENT_FALLBACK_TYPE_LABEL = "DOC";
