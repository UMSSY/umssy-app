export interface NewRefreshToken {
  userId: string;
  familyId: string;
  roleTag: string;
  tokenHash: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  userAgent: string | null;
}
