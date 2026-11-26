import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRevokedSession(sessionId: string) {
    return this.prisma.refreshToken.findFirst({
      where: { familyId: sessionId, revokedAt: { not: null } },
      select: { revokedReason: true },
    });
  }

  findActiveUserById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        email: true,
        company: { select: { id: true, title: true } },
        roles: {
          where: { deletedAt: null, startAt: { lte: new Date() } },
          select: { role: { select: { name: true } } },
        },
      },
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findFirst({
      where: { id },
      select: {
        id: true,
        email: true,
        company: { select: { id: true, title: true } },
        isActive: true,
        roles: {
          where: { deletedAt: null, startAt: { lte: new Date() } },
          select: { role: { select: { name: true } } },
        },
      },
    });
  }
}
