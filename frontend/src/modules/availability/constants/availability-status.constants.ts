export const AVAILABILITY_STATUS_TEXT = {
  label: "Recibir solicitudes de mentoría",
  activeHint: "Los egresados pueden solicitarte mentorías.",
  pausedHint: "Pausado: tus citas confirmadas se mantienen.",
  loadError: "No se pudo cargar tu estado de disponibilidad",
} as const;

export const AVAILABILITY_STATUS_TOAST = {
  resumed: "Ahora recibes solicitudes de mentoría.",
  paused: "Pausaste las solicitudes de mentoría. Tus citas confirmadas se mantienen.",
  error: "No se pudo actualizar tu disponibilidad",
} as const;
