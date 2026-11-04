import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

/** Persistence for Radar role checks and append-only audit events. */
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
  ): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO radar_audit_events (user_id,actor_id,event_type,target_id,details)
      VALUES (${userId}::uuid,${actorId}::uuid,${event},${targetId}::uuid,${JSON.stringify(details)}::jsonb)`;
  }
}
