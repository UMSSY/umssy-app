import { RadarDocumentStatus } from './radar-document-status.enum.js';
export const RADAR_DOCUMENT_STATUSES = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    title: RadarDocumentStatus.QUEUED,
    description: 'En cola',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    title: RadarDocumentStatus.READING,
    description: 'En proceso',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    title: RadarDocumentStatus.APPROVED,
    description: 'Aprobado automáticamente',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000004',
    title: RadarDocumentStatus.REVIEW,
    description: 'En revisión administrativa',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000005',
    title: RadarDocumentStatus.LOW_CONFIDENCE,
    description: 'Lectura insuficiente',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000006',
    title: RadarDocumentStatus.MANUAL_APPROVED,
    description: 'Aprobado por administración',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000007',
    title: RadarDocumentStatus.MANUAL_REJECTED,
    description: 'Rechazado por administración',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000008',
    title: RadarDocumentStatus.LEGACY,
    description: 'Registro previo',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000009',
    title: RadarDocumentStatus.CANCELLED,
    description: 'Cancelado',
  },
] as const;
