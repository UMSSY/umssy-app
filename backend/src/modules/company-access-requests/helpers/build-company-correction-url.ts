import { buildFrontendUrl } from '../../mail/helpers/frontend-url.js';
import { COMPANY_CORRECTION_FRAGMENT_KEY } from '../constants/company-document-correction.constants.js';

export function buildCompanyCorrectionUrl(
  requestCode: string,
  email: string,
  token: string,
): string {
  const url = new URL(
    buildFrontendUrl('/request-access/status', { code: requestCode, email }),
  );
  url.hash = new URLSearchParams({
    [COMPANY_CORRECTION_FRAGMENT_KEY]: token,
  }).toString();
  return url.toString();
}
