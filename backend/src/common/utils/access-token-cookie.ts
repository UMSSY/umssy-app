import type { CookieOptions } from 'express';

export function buildSessionCookieOptions(
  maxAgeMs: number,
  path = '/',
): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path,
    maxAge: maxAgeMs,
  };
}

export function buildClearSessionCookieOptions(path = '/'): CookieOptions {
  const { maxAge: _maxAge, ...options } = buildSessionCookieOptions(0, path);
  return options;
}

export function buildAccessTokenCookieOptions(maxAgeMs: number): CookieOptions {
  return buildSessionCookieOptions(maxAgeMs, '/');
}

export function buildClearAccessTokenCookieOptions(): CookieOptions {
  return buildClearSessionCookieOptions('/');
}
