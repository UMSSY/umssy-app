import type { Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../../../common/constants/auth.constants.js';
import {
  buildAccessTokenCookieOptions,
  buildClearAccessTokenCookieOptions,
} from '../../../common/utils/access-token-cookie.js';
import {
  buildClearRefreshTokenCookieOptions,
  buildRefreshTokenCookieOptions,
} from './refresh-token-cookie.util.js';

export function writeSessionCookies(
  response: Pick<Response, 'cookie'>,
  tokens: {
    accessToken: string;
    accessMaxAgeMs: number;
    refreshToken: string;
    refreshMaxAgeMs: number;
  },
): void {
  response.cookie(
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    buildAccessTokenCookieOptions(tokens.accessMaxAgeMs),
  );
  response.cookie(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    buildRefreshTokenCookieOptions(tokens.refreshMaxAgeMs),
  );
}

export function clearSessionCookies(
  response: Pick<Response, 'clearCookie'>,
): void {
  response.clearCookie(
    ACCESS_TOKEN_COOKIE,
    buildClearAccessTokenCookieOptions(),
  );
  response.clearCookie(
    REFRESH_TOKEN_COOKIE,
    buildClearRefreshTokenCookieOptions(),
  );
}
