import type { VerificationStatus } from '../types/verification-status.types';
export const verificationLabels: Record<VerificationStatus, string> = {
  queued: 'En cola',
  reading: 'En proceso',
  approved: 'Aprobado automáticamente',
  review: 'En revisión administrativa',
  low_confidence: 'Rechazado por baja confianza',
  manual_approved: 'Aprobado por administración',
  manual_rejected: 'Rechazado por administración',
  cancelled: 'Análisis interrumpido por retiro del archivo',
  legacy: 'Anterior a la verificación automática',
};
