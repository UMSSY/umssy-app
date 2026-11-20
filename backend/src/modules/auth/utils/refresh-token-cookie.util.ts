import type { CookieOptions } from 'express';
import {
  buildSessionCookieOptions,
  buildClearSessionCookieOptions,
} from '../../../common/utils/access-token-cookie.js';
import { REFRESH_TOKEN_COOKIE_PATH } from '../constants/refresh-token.constants.js';

export function buildRefreshTokenCookieOptions(maxAgeMs: number): CookieOptions {
  return buildSessionCookieOptions(maxAgeMs, REFRESH_TOKEN_COOKIE_PATH);
}

export function buildClearRefreshTokenCookieOptions(): CookieOptions {
  return buildClearSessionCookieOptions(REFRESH_TOKEN_COOKIE_PATH);
}
