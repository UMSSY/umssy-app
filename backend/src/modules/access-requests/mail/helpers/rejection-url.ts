import { DOCUMENT_CORRECTION_TOKEN_PATTERN } from '../../constants/document-correction.constants.js';
import { RejectionMailContextException } from '../../exceptions/rejection-mail-context.exception.js';
import type { DocumentCorrectionGrant } from '../../types/document-correction.types.js';
import { buildFrontendUrl } from './frontend-url.js';

export function buildRejectionUrl(grant: DocumentCorrectionGrant): string {
  if (!grant.requestCode || !DOCUMENT_CORRECTION_TOKEN_PATTERN.test(grant.token)) {
    throw new RejectionMailContextException();
  }
  const url = new URL(buildFrontendUrl('/request-access/status', { code: grant.requestCode }));
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new RejectionMailContextException();
  }
  // El correo no va en la URL. El permiso solo está en el fragmento que lee F2.
  url.hash = new URLSearchParams({ correctionToken: grant.token }).toString();
  return url.toString();
}
