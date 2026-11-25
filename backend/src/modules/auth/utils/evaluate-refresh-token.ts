import { REFRESH_REVOCATION_REASONS } from '../constants/refresh-token.constants.js';
import type { RefreshTokenState } from '../types/refresh-token-state.types.js';
import type { RefreshTokenVerdict } from '../types/refresh-token-verdict.types.js';

export type { RefreshTokenState, RefreshTokenVerdict };

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

export function computeSlidingExpiry(
  now: Date,
  absoluteExpiresAt: Date,
  idleMs: number,
): Date {
  return new Date(
    Math.min(now.getTime() + idleMs, absoluteExpiresAt.getTime()),
  );
}
