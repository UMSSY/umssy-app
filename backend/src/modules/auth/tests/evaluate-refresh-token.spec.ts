import { describe, expect, it } from 'vitest';
import {
  computeSlidingExpiry,
  evaluateRefreshToken,
  type RefreshTokenState,
} from '../utils/evaluate-refresh-token.js';

const NOW = new Date('2026-11-14T12:00:00.000Z');
const minutes = (value: number) => new Date(NOW.getTime() + value * 60_000);

function token(overrides: Partial<RefreshTokenState> = {}): RefreshTokenState {
  return {
    usedAt: null,
    revokedAt: null,
    revokedReason: null,
    expiresAt: minutes(10),
    absoluteExpiresAt: minutes(300),
    ...overrides,
  };
}

describe('evaluateRefreshToken', () => {
  it('accepts an unused, unrevoked token inside both windows', () => {
    expect(evaluateRefreshToken(token(), NOW)).toEqual({ outcome: 'valid' });
  });

  it('flags an already used token as reuse', () => {
    expect(
      evaluateRefreshToken(token({ usedAt: minutes(-1) }), NOW),
    ).toEqual({ outcome: 'reuse' });
  });

  it('reports a revoked token as SESSION_REVOKED', () => {
    expect(
      evaluateRefreshToken(
        token({ revokedAt: minutes(-1), revokedReason: 'logout' }),
        NOW,
      ),
    ).toEqual({ outcome: 'revoked', code: 'SESSION_REVOKED' });
  });

  it('reports a token revoked by a password change as PASSWORD_CHANGED', () => {
    expect(
      evaluateRefreshToken(
        token({ revokedAt: minutes(-1), revokedReason: 'password_changed' }),
        NOW,
      ),
    ).toEqual({ outcome: 'revoked', code: 'PASSWORD_CHANGED' });
  });

  it('prefers revoked over reuse once the family was revoked', () => {
    expect(
      evaluateRefreshToken(
        token({
          usedAt: minutes(-2),
          revokedAt: minutes(-1),
          revokedReason: 'reuse_detected',
        }),
        NOW,
      ),
    ).toEqual({ outcome: 'revoked', code: 'SESSION_REVOKED' });
  });

  it('expires after the idle window', () => {
    expect(
      evaluateRefreshToken(token({ expiresAt: minutes(-1) }), NOW),
    ).toEqual({ outcome: 'expired' });
  });

  it('expires exactly at the idle boundary', () => {
    expect(evaluateRefreshToken(token({ expiresAt: NOW }), NOW)).toEqual({
      outcome: 'expired',
    });
  });

  it('expires after the absolute cap even if the idle window is open', () => {
    expect(
      evaluateRefreshToken(
        token({ expiresAt: minutes(10), absoluteExpiresAt: minutes(-1) }),
        NOW,
      ),
    ).toEqual({ outcome: 'expired' });
  });
});

describe('computeSlidingExpiry', () => {
  it('slides by the idle time when far from the cap', () => {
    expect(computeSlidingExpiry(NOW, minutes(300), 15 * 60_000)).toEqual(
      minutes(15),
    );
  });

  it('never goes past the absolute cap', () => {
    expect(computeSlidingExpiry(NOW, minutes(5), 15 * 60_000)).toEqual(
      minutes(5),
    );
  });
});
