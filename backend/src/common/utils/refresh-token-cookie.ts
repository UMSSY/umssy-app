import type { CookieOptions } from 'express';
import { REFRESH_TOKEN_COOKIE_PATH } from '../../modules/auth/constants/refresh-token.constants.js';

export function buildRefreshTokenCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_TOKEN_COOKIE_PATH,
    maxAge: maxAgeMs,
  };
}

export function buildClearRefreshTokenCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...options } = buildRefreshTokenCookieOptions(0);
  return options;
}
