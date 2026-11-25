import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractSocketAccessToken } from '../utils/extract-socket-access-token.js';

describe('extractSocketAccessToken', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads the token from handshake.auth.token when provided', () => {
    expect(
      extractSocketAccessToken({
        auth: { token: '  jwt.from.auth  ' },
        headers: { cookie: 'umssy_access=jwt.from.cookie' },
      }),
    ).toBe('jwt.from.auth');
  });

  it('falls back to the umssy_access HttpOnly cookie when handshake auth has no token', () => {
    vi.stubEnv('CORS_ORIGIN', 'https://app.umssy.test');

    expect(
      extractSocketAccessToken({
        auth: {},
        headers: {
          origin: 'https://app.umssy.test',
          cookie: 'other=1; umssy_access=jwt.from.cookie%20',
        },
      }),
    ).toBe('jwt.from.cookie');
  });

  it('rejects cookie fallback when origin does not match configured CORS_ORIGIN', () => {
    vi.stubEnv('CORS_ORIGIN', 'https://app.umssy.test');

    expect(
      extractSocketAccessToken({
        auth: {},
        headers: {
          origin: 'https://evil.example',
          cookie: 'umssy_access=jwt.from.cookie',
        },
      }),
    ).toBeNull();
  });

  it('returns null when neither auth token nor cookie is present', () => {
    expect(extractSocketAccessToken(undefined)).toBeNull();
    expect(extractSocketAccessToken({ auth: {}, headers: {} })).toBeNull();
    expect(
      extractSocketAccessToken({
        auth: { token: '   ' },
        headers: { cookie: 'umssy_access=   ' },
      }),
    ).toBeNull();
  });
});
