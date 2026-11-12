export const APPOINTMENT_MESSAGE_MAX_LENGTH = 300;

export const APPOINTMENT_REQUEST_ERROR_CODES = {
  overlap: "APPOINTMENT_OVERLAP",
  dailyLimit: "DAILY_APPOINTMENT_LIMIT",
} as const;

export const REQUEST_APPOINTMENT_TEXT = {
  topicLabel: "Tema de la sesión",
  topicPlaceholder: "Selecciona un tema",
  messageLabel: "Mensaje para el mentor",
  submit: "Solicitar cita",
  submitting: "Solicitando...",
  instantConfirmationNote: "La cita se confirma al instante y el horario queda reservado para ti.",
  missingTopic: "Selecciona el tema de la sesión",
  missingMessage: "Escribe un mensaje para el mentor",
  messageTooLong: `El mensaje no puede superar los ${APPOINTMENT_MESSAGE_MAX_LENGTH} caracteres`,
  confirmed: "Cita confirmada",
  overlap: "Ya tienes una cita en ese horario. Elige otro horario.",
  dailyLimit: "Ya tienes una cita reservada ese día. Elige otro día.",
  alreadyBooked: "Este horario ya fue reservado",
  createError: "No se pudo solicitar la cita. Intenta de nuevo.",
} as const;

export const LEAVE_REQUEST_TEXT = {
  title: "¿Salir sin enviar la solicitud?",
  description: "Tu solicitud de cita no se envió. Si sales ahora, se perderán los datos ingresados.",
  stay: "Seguir aquí",
  leave: "Salir",
} as const;
