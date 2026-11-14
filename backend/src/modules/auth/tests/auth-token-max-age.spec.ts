import { JwtService } from '@nestjs/jwt';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_MAX_MS } from '../constants/session.constants.js';
import { AuthService } from '../services/auth.service.js';

describe('AuthService.getAccessTokenMaxAgeMs', () => {
  const jwt = new JwtService({ secret: 'max-age-test-secret' });
  const service = new AuthService({} as any, jwt, {} as any);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-14T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the time left before the token expires', () => {
    const token = jwt.sign({ sub: 'u' }, { expiresIn: '15m' });

    expect(service.getAccessTokenMaxAgeMs(token)).toBe(15 * 60 * 1000);
  });

  it('never goes below zero for a token that already expired', () => {
    const token = jwt.sign({ sub: 'u' }, { expiresIn: '1m' });
    vi.setSystemTime(new Date('2026-11-14T12:10:00Z'));

    expect(service.getAccessTokenMaxAgeMs(token)).toBe(0);
  });

  it('falls back to the session cap when the token has no expiry', () => {
    const token = jwt.sign({ sub: 'u' }, { noTimestamp: true });

    expect(service.getAccessTokenMaxAgeMs(token)).toBe(SESSION_MAX_MS);
  });
});
