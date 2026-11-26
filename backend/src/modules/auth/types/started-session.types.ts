import type { IssuedRefreshToken } from './issued-refresh-token.types.js';

export interface StartedSession extends IssuedRefreshToken {
  accessToken: string;
  accessMaxAgeMs: number;
}
