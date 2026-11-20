import type { IssuedRefreshToken } from './issued-refresh-token.types.js';

export interface RotatedSession extends IssuedRefreshToken {
  accessToken: string;
  accessMaxAgeMs: number;
  roleTag: string;
  roles: string[];
}
