export const RADAR_DOCUMENT_STATUSES = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    title: 'queued',
    description: 'En cola',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    title: 'reading',
    description: 'En proceso',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    title: 'approved',
    description: 'Aprobado automáticamente',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000004',
    title: 'review',
    description: 'En revisión administrativa',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000005',
    title: 'low_confidence',
    description: 'Lectura insuficiente',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000006',
    title: 'manual_approved',
    description: 'Aprobado por administración',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000007',
    title: 'manual_rejected',
    description: 'Rechazado por administración',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000008',
    title: 'legacy',
    description: 'Registro previo',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000009',
    title: 'cancelled',
    description: 'Cancelado',
  },
] as const;
