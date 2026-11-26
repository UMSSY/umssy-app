export const COMPANY_CORRECTION_TOKEN_PATTERN = /^ccr1\.[A-Za-z0-9_-]{43}$/;

export const COMPANY_CORRECTION_TOKEN_CONTEXT =
  'umssy:company-access-request:document-correction:v1';

export const COMPANY_REQUEST_CODE_PATTERN = /^EMP-\d{4}-\d{4,}$/;

export const COMPANY_CORRECTION_STATUSES = ['OBSERVED', 'REJECTED'] as const;

export const COMPANY_CORRECTION_FRAGMENT_KEY = 'token';

export const COMPANY_PUBLIC_REQUEST_LIMITS = {
  windowMs: 15 * 60 * 1000,
  status: 20,
  resubmit: 10,
} as const;
