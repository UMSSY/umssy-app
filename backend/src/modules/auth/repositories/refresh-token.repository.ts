import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { RefreshRevocationReason } from '../constants/refresh-token.constants.js';

export interface NewRefreshToken {
  userId: string;
  familyId: string;
  roleTag: string;
  tokenHash: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  userAgent: string | null;
}

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewRefreshToken) {
    return this.prisma.refreshToken.create({ data });
  }

  findByHash(tokenHash: string) {
    return this.prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  // Marks the current token as used and stores the next one atomically.
  // Returns false when someone else already used or revoked the token.
  rotate(currentId: string, next: NewRefreshToken): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const consumed = await tx.refreshToken.updateMany({
        where: { id: currentId, usedAt: null, revokedAt: null },
        data: { usedAt: new Date() },
      });
      if (consumed.count === 0) return false;
      await tx.refreshToken.create({ data: next });
      return true;
    });
  }

  revokeFamily(familyId: string, reason: RefreshRevocationReason) {
    return this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }
}
