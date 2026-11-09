import { createHmac, timingSafeEqual } from 'node:crypto';
import { DOCUMENT_CORRECTION_TOKEN_PATTERN } from '../constants/document-correction.constants.js';
import type { DocumentCorrectionContext } from '../types/document-correction.types.js';

export function createDocumentCorrectionToken(
  context: DocumentCorrectionContext,
  secret: string,
): string {
  const snapshot = JSON.stringify([
    'umssy:access-request:document-correction:v1',
    context.accessRequestId,
    context.requestCode,
    context.previousFileId,
    context.revision.toISOString(),
  ]);
  const signature = createHmac('sha256', secret)
    .update(snapshot)
    .digest('base64url');
  return `dcr1.${signature}`;
}

export function matchesDocumentCorrectionToken(
  context: DocumentCorrectionContext,
  token: unknown,
  secret: string,
): boolean {
  if (
    typeof token !== 'string' ||
    !DOCUMENT_CORRECTION_TOKEN_PATTERN.test(token)
  )
    return false;
  const expected = createDocumentCorrectionToken(context, secret);
  return timingSafeEqual(
    Buffer.from(expected, 'utf8'),
    Buffer.from(token, 'utf8'),
  );
}
