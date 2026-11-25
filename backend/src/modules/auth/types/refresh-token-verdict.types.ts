export type RefreshTokenVerdict =
  | { outcome: 'valid' }
  | { outcome: 'reuse' }
  | { outcome: 'expired' }
  | { outcome: 'revoked'; code: 'SESSION_REVOKED' | 'PASSWORD_CHANGED' };
