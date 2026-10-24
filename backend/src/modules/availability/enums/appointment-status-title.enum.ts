export enum AppointmentStatusTitle {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  // TODO: eliminar cuando no queden citas con este título en Staging.
  LEGACY_CONFIRMED = 'CONFIRMADA',
  // TODO: eliminar cuando no queden citas con este título en Staging; ya no se crean citas pendientes.
  LEGACY_PENDING = 'PENDIENTE',
}
