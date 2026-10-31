import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  DOCUMENT_CORRECTION_TOKEN_PATTERN,
  DOCUMENT_CORRECTION_TOKEN_PREFIX,
  DOCUMENT_CORRECTION_TOKEN_PURPOSE,
} from '../constants/document-correction.constants.js';
import type { DocumentCorrectionContext } from '../types/document-correction.types.js';

// La revisión de la fila y el documento vinculan el permiso a un ciclo de rechazo.
// No hay vencimiento temporal: el cambio confirmado de la solicitud lo invalida.
export function createDocumentCorrectionToken(context: DocumentCorrectionContext, secret: string): string {
  const snapshot = JSON.stringify([
    DOCUMENT_CORRECTION_TOKEN_PURPOSE,
    context.accessRequestId,
    context.requestCode,
    context.previousFileId,
    context.revision.toISOString(),
  ]);
  const signature = createHmac('sha256', secret).update(snapshot).digest('base64url');
  return `${DOCUMENT_CORRECTION_TOKEN_PREFIX}${signature}`;
}

export function matchesDocumentCorrectionToken(context: DocumentCorrectionContext, token: unknown, secret: string): boolean {
  if (typeof token !== 'string' || !DOCUMENT_CORRECTION_TOKEN_PATTERN.test(token)) return false;
  const expected = createDocumentCorrectionToken(context, secret);
  return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(token, 'utf8'));
}
