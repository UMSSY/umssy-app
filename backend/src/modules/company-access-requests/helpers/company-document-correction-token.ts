import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  COMPANY_CORRECTION_TOKEN_CONTEXT,
  COMPANY_CORRECTION_TOKEN_PATTERN,
} from '../constants/company-document-correction.constants.js';
import type { CompanyDocumentCorrectionContext } from '../types/company-document-correction.types.js';

export function createCompanyCorrectionToken(
  context: CompanyDocumentCorrectionContext,
  secret: string,
): string {
  const snapshot = JSON.stringify([
    COMPANY_CORRECTION_TOKEN_CONTEXT,
    context.requestId,
    context.requestCode,
    context.previousFileId,
    context.revision.toISOString(),
  ]);
  const signature = createHmac('sha256', secret)
    .update(snapshot)
    .digest('base64url');
  return `ccr1.${signature}`;
}

export function matchesCompanyCorrectionToken(
  context: CompanyDocumentCorrectionContext,
  token: unknown,
  secret: string,
): boolean {
  if (
    typeof token !== 'string' ||
    !COMPANY_CORRECTION_TOKEN_PATTERN.test(token)
  )
    return false;
  return timingSafeEqual(
    Buffer.from(createCompanyCorrectionToken(context, secret), 'utf8'),
    Buffer.from(token, 'utf8'),
  );
}
