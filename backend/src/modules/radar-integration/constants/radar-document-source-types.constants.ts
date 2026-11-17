import { RadarDocumentSourceType } from './radar-document-source-type.enum.js';
export const RADAR_DOCUMENT_SOURCE_TYPES = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    title: RadarDocumentSourceType.CV,
    description: 'Currículum',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000002',
    title: RadarDocumentSourceType.CERTIFICATION,
    description: 'Certificación',
  },
] as const;
