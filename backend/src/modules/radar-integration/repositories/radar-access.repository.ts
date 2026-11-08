import type { Prisma } from '../../../prisma/client.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

import type { TransactionContext } from '../../../common/types/transaction-context.types.js';

@Injectable()
export class RadarAccessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasRole(userId: string, role: string): Promise<boolean> {
    const row = await this.prisma.userRole.findFirst({
      where: { userId, deletedAt: null, role: { name: role } },
      select: { id: true },
    });
    return row !== null;
  }

  async hasAnyRole(userId: string, roles: string[]): Promise<boolean> {
    const row = await this.prisma.userRole.findFirst({
      where: { userId, deletedAt: null, role: { name: { in: roles } } },
      select: { id: true },
    });
    return row !== null;
  }

  async recordAudit(
    userId: string,
    actorId: string | null,
    event: string,
    targetId: string | null,
    details: object = {},
    context?: TransactionContext,
  ): Promise<void> {
    const client = context?.client ?? this.prisma;
    await client.radarAuditEvent.create({
      data: { userId, actorId, eventType: event, targetId, details: JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue },
      select: { id: true },
    });
  }
}
