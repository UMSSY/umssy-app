import type { CookieOptions } from 'express';

export function buildAccessTokenCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}

export function buildClearAccessTokenCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...options } = buildAccessTokenCookieOptions(0);
  return options;
}
