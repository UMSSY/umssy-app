export const BLOCKED_DATE_TEXT = {
  blocked: "Fecha bloqueada correctamente",
  unblocked: "Fecha desbloqueada correctamente",
  blockError: "Error al bloquear la fecha",
  unblockError: "Error al desbloquear la fecha",
  loadError: "Error al obtener las fechas bloqueadas",
  listTitle: "Fechas bloqueadas",
  listHint: "Desde hoy, aunque estén fuera de la semana visible.",
  emptyList: "No tienes fechas bloqueadas",
  loadingList: "Cargando fechas bloqueadas...",
  retry: "Reintentar",
  unblocking: "Desbloqueando...",
  blockTitle: "Bloquear fecha",
  unblockTitle: "Desbloquear fecha",
  blockHint: "Los horarios de este día dejarán de ofrecerse sin eliminar tus bloques.",
  blockedNotice:
    "Esta fecha está bloqueada. Al desbloquearla, sus horarios originales volverán a estar disponibles.",
  reasonLabel: "Motivo (opcional)",
  reasonPrefix: "Motivo:",
  charactersUnit: "caracteres",
  cancel: "Cancelar",
  saving: "Guardando...",
  blockedDay: "Fecha bloqueada",
  selectDate: "Seleccionar fecha",
  viewHint: "Selecciona el encabezado de un día para bloquear o desbloquear la fecha.",
} as const;

export const BLOCKED_DATE_REASON_MAX_LENGTH = 100;
export const BLOCKED_DATE_PAST_ERROR = "No se pueden bloquear fechas pasadas";
export const BLOCKED_DATE_REASON_ERROR = `El motivo no puede superar los ${BLOCKED_DATE_REASON_MAX_LENGTH} caracteres`;
