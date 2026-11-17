import { REFRESH_REVOCATION_REASONS } from '../constants/refresh-token.constants.js';

export interface RefreshTokenState {
  usedAt: Date | null;
  revokedAt: Date | null;
  revokedReason: string | null;
  expiresAt: Date;
  absoluteExpiresAt: Date;
}

export type RefreshTokenVerdict =
  | { outcome: 'valid' }
  | { outcome: 'reuse' }
  | { outcome: 'expired' }
  | { outcome: 'revoked'; code: 'SESSION_REVOKED' | 'PASSWORD_CHANGED' };

export function evaluateRefreshToken(
  token: RefreshTokenState,
  now: Date,
): RefreshTokenVerdict {
  if (token.revokedAt) {
    const code =
      token.revokedReason === REFRESH_REVOCATION_REASONS.passwordChanged
        ? 'PASSWORD_CHANGED'
        : 'SESSION_REVOKED';
    return { outcome: 'revoked', code };
  }
  if (token.usedAt) return { outcome: 'reuse' };
  if (
    now.getTime() >= token.expiresAt.getTime() ||
    now.getTime() >= token.absoluteExpiresAt.getTime()
  ) {
    return { outcome: 'expired' };
  }
  return { outcome: 'valid' };
}

// Sliding window: now + idle time, never past the absolute session cap.
export function computeSlidingExpiry(
  now: Date,
  absoluteExpiresAt: Date,
  idleMs: number,
): Date {
  return new Date(
    Math.min(now.getTime() + idleMs, absoluteExpiresAt.getTime()),
  );
}
