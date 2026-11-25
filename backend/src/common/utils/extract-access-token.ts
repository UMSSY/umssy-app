import type { Request } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  BEARER_PREFIX,
} from '../constants/auth.constants.js';
import type {
  AccessTokenSource,
  ExtractedAccessToken,
} from '../types/extracted-access-token.types.js';

export type { AccessTokenSource, ExtractedAccessToken };

export function extractAccessToken(
  request: Pick<Request, 'headers' | 'cookies'>,
): ExtractedAccessToken | null {
  const authorization = request.headers?.authorization;
  if (typeof authorization === 'string') {
    if (!authorization.startsWith(BEARER_PREFIX)) return null;
    const token = authorization.slice(BEARER_PREFIX.length).trim();
    return token ? { token, source: 'bearer' } : null;
  }

  const cookie: unknown = request.cookies?.[ACCESS_TOKEN_COOKIE];
  if (typeof cookie === 'string' && cookie.trim()) {
    return { token: cookie.trim(), source: 'cookie' };
  }
  return null;
}
