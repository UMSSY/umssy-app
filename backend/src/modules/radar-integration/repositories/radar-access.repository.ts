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
    await client.$executeRaw`
      INSERT INTO radar_audit_events (user_id,actor_id,event_type,target_id,details)
      VALUES (${userId}::uuid,${actorId}::uuid,${event},${targetId}::uuid,${JSON.stringify(details)}::jsonb)`;
  }
}
