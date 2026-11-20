import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildRefreshTokenCookieOptions,
  buildClearRefreshTokenCookieOptions,
} from '../utils/refresh-token-cookie.util.js';
import { REFRESH_TOKEN_COOKIE_PATH } from '../constants/refresh-token.constants.js';

describe('refresh token cookie options', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is HttpOnly, same-site lax and scoped to the auth prefix', () => {
    expect(buildRefreshTokenCookieOptions(60000)).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
      maxAge: 60000,
    });
  });

  it('is Secure only in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(buildRefreshTokenCookieOptions(1).secure).toBe(true);
    vi.stubEnv('NODE_ENV', 'development');
    expect(buildRefreshTokenCookieOptions(1).secure).toBe(false);
  });

  it('clears the cookie with the same path and no maxAge', () => {
    const options = buildClearRefreshTokenCookieOptions();
    expect(options).toMatchObject({
      httpOnly: true,
      path: REFRESH_TOKEN_COOKIE_PATH,
    });
    expect(options).not.toHaveProperty('maxAge');
  });
});
