import { ACCESS_TOKEN_COOKIE } from '../constants/auth.constants.js';
import { parseCorsOrigins } from './cors-origins.js';

export interface SocketHandshakeLike {
  auth?: { token?: unknown };
  headers?: {
    cookie?: string;
    origin?: string;
  };
}

function readCookieValue(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = part.slice(0, separatorIndex).trim();
    if (key !== name) continue;
    const rawValue = part.slice(separatorIndex + 1).trim();
    if (!rawValue) return null;
    try {
      const decoded = decodeURIComponent(rawValue).trim();
      return decoded || null;
    } catch {
      return rawValue;
    }
  }
  return null;
}

function isAllowedCookieOrigin(origin: string | undefined): boolean {
  const allowedOrigins = parseCorsOrigins();
  if (allowedOrigins.length === 0 || !origin) return true;
  return allowedOrigins.includes(origin);
}

export function extractSocketAccessToken(
  handshake: SocketHandshakeLike | undefined,
): string | null {
  const authToken = handshake?.auth?.token;
  if (typeof authToken === 'string' && authToken.trim()) {
    return authToken.trim();
  }

  const cookieHeader = handshake?.headers?.cookie;
  if (typeof cookieHeader !== 'string' || !cookieHeader.trim()) {
    return null;
  }

  if (!isAllowedCookieOrigin(handshake?.headers?.origin)) {
    return null;
  }

  return readCookieValue(cookieHeader, ACCESS_TOKEN_COOKIE);
}
