export enum AppointmentStatusTitle {
  // TODO: eliminar PENDING en #1161 (B-09), las citas se confirman al reservar.
  PENDING = 'PENDIENTE',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  // TODO: eliminar en #1161 (B-09) cuando no queden citas con este título.
  LEGACY_CONFIRMED = 'CONFIRMADA',
}
