export const CANCELLATION_REASON_MAX_LENGTH = 300;
export const CANCELLATION_REASON_WINDOW_MS = 24 * 60 * 60 * 1000;

export const CANCEL_APPOINTMENT_TEXT = {
  title: "Cancelar cita",
  description: "Revisa los datos de la cita antes de confirmar la cancelación.",
  reason: "Motivo",
  required: "Obligatorio si faltan menos de 24 horas.",
  reasonRequired: "Indica el motivo de la cancelación",
  reasonTooLong: `El motivo no puede superar los ${CANCELLATION_REASON_MAX_LENGTH} caracteres`,
  back: "Volver",
  confirm: "Confirmar cancelación",
  pending: "Cancelando…",
  success: "Cita cancelada",
  error: "No se pudo cancelar la cita. Intenta nuevamente.",
  unavailable: "Esta cita ya no se puede cancelar.",
} as const;
