import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import { PASSWORD_HISTORY_LIMIT } from '../constants/password-history.constants.js';
import type { PasswordHistorySnapshot } from '../types/password-history.types.js';

@Injectable()
export class PasswordHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findSnapshot(userId: string): Promise<PasswordHistorySnapshot | null> {
    // Ambas lecturas deben observar la misma versión del usuario y su historial.
    return this.prisma.$transaction(
      (transaction) =>
        transaction.user.findUnique({
          where: { id: userId },
          select: {
            password: true,
            passwordHistories: {
              take: PASSWORD_HISTORY_LIMIT,
              orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
              select: { passwordHash: true },
            },
          },
        }),
      { isolationLevel: 'RepeatableRead' },
    );
  }

  async recordPreviousAndTrim(
    transaction: Prisma.TransactionClient,
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await transaction.passwordHistory.create({
      data: { userId, passwordHash },
    });

    const obsolete = await transaction.passwordHistory.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: PASSWORD_HISTORY_LIMIT,
      select: { id: true },
    });

    if (obsolete.length === 0) return;

    await transaction.passwordHistory.deleteMany({
      where: {
        userId,
        id: { in: obsolete.map(({ id }) => id) },
      },
    });
  }
}

