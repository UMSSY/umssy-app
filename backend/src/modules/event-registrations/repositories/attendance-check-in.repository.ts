import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

@Injectable()
export class AttendanceCheckInRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    });
  }

  async lockRegistration(tx: Prisma.TransactionClient, eventId: string, registrationId: string): Promise<boolean> {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM event_registrations
      WHERE id = ${registrationId}::uuid AND event_id = ${eventId}::uuid
      FOR UPDATE
    `;
    return rows.length === 1;
  }

  insertIfAbsent(tx: Prisma.TransactionClient, registrationId: string, actorId: string, checkedInAt: Date) {
    return tx.eventAttendance.createMany({
      data: {
        registrationId,
        checkedInAt,
        checkedInById: actorId,
        checkedInOffline: false,
        syncedAt: null,
      },
      skipDuplicates: true,
    });
  }

  findAttendance(tx: Prisma.TransactionClient, registrationId: string) {
    return tx.eventAttendance.findUnique({
      where: { registrationId },
      select: { checkedInAt: true },
    });
  }
}
