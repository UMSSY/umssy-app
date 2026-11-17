import type { DocumentVerification } from '../types/document-verification.types';
export const formatVerificationConfidence = (doc: DocumentVerification) =>
  doc.confidence === null
    ? 'Sin medición'
    : new Intl.NumberFormat('es-BO', {
        style: 'percent',
        maximumFractionDigits: 1,
      }).format(doc.confidence);
