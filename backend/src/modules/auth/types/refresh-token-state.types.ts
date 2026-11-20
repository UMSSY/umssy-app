export interface RefreshTokenState {
  usedAt: Date | null;
  revokedAt: Date | null;
  revokedReason: string | null;
  expiresAt: Date;
  absoluteExpiresAt: Date;
}
