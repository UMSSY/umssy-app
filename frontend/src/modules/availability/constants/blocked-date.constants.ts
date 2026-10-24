export const BLOCKED_DATE_TEXT = {
  blocked: "Fecha bloqueada correctamente",
  unblocked: "Fecha desbloqueada correctamente",
  blockError: "Error al bloquear la fecha",
  unblockError: "Error al desbloquear la fecha",
  loadError: "Error al obtener las fechas bloqueadas",
} as const;

export const BLOCKED_DATE_REASON_MAX_LENGTH = 100;
export const BLOCKED_DATE_PAST_ERROR = "No se pueden bloquear fechas pasadas";
export const BLOCKED_DATE_REASON_ERROR = "El motivo no puede superar los 100 caracteres";
