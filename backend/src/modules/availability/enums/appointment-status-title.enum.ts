export enum AppointmentStatusTitle {
  PENDING = 'PENDIENTE',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  // Se conserva para leer citas anteriores sin transformar datos ajenos.
  LEGACY_CONFIRMED = 'CONFIRMADA',
}
