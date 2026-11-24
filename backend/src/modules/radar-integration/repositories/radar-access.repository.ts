import type { Prisma } from '../../../prisma/client.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

import type { TransactionContext } from '../../../common/types/transaction-context.types.js';

@Injectable()
export class RadarAccessRepository {
  constructor(private readonly prisma: PrismaService) {}

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
      data: {
        userId,
        actorId,
        eventType: event,
        targetId,
        details: JSON.parse(JSON.stringify(details)) as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
  }
}
