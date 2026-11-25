import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAccessTokenCookieOptions,
  buildClearAccessTokenCookieOptions,
} from '../utils/access-token-cookie.js';
import { parseCorsOrigins } from '../utils/cors-origins.js';

describe('access token cookie options', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is HttpOnly, same-site lax and scoped to the whole API', () => {
    expect(buildAccessTokenCookieOptions(5000)).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 5000,
    });
  });

  it('is Secure only in production so local HTTP development still works', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(buildAccessTokenCookieOptions(1).secure).toBe(true);
    vi.stubEnv('NODE_ENV', 'development');
    expect(buildAccessTokenCookieOptions(1).secure).toBe(false);
  });

  it('clears the cookie with the same attributes and no maxAge', () => {
    const options = buildClearAccessTokenCookieOptions();
    expect(options).toMatchObject({ httpOnly: true, path: '/' });
    expect(options).not.toHaveProperty('maxAge');
  });
});

describe('parseCorsOrigins', () => {
  it('splits, trims and drops empty entries', () => {
    expect(parseCorsOrigins(' https://a.test , ,https://b.test ')).toEqual([
      'https://a.test',
      'https://b.test',
    ]);
  });

  it('returns an empty list when the value is empty', () => {
    expect(parseCorsOrigins('')).toEqual([]);
  });

  it('reads CORS_ORIGIN by default and is empty when it is not set', () => {
    vi.stubEnv('CORS_ORIGIN', 'https://a.test,https://b.test');
    expect(parseCorsOrigins()).toEqual(['https://a.test', 'https://b.test']);
    vi.stubEnv('CORS_ORIGIN', undefined);
    expect(parseCorsOrigins()).toEqual([]);
  });
});
