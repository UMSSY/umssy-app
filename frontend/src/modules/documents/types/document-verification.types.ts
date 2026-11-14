export type VerificationStatus =
  | 'queued'
  | 'reading'
  | 'approved'
  | 'review'
  | 'low_confidence'
  | 'manual_approved'
  | 'manual_rejected'
  | 'cancelled'
  | 'legacy';
export interface DocumentVerification {
  id: string;
  sourceId: string;
  sourceType: 'cv' | 'certification';
  filename: string;
  mime: string;
  sizeBytes: number;
  noticeRead: boolean;
  radarVersion: number | null;
  publishedIds: string[];
  status: VerificationStatus;
  confidence: number | null;
  reason: string;
  active: boolean;
  synced: boolean;
  available: boolean;
  createdAt: string;
  decidedAt: string | null;
  skills: { id: string; name: string; areaId: string }[];
  ownerName?: string;
}
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
export const isApproved = (status: VerificationStatus) =>
  status === 'approved' || status === 'manual_approved';
