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

  // Se ejecuta con la inscripción bloqueada; así también se evita duplicar asistencias sin sesión.
  async insertIfAbsent(
    tx: Prisma.TransactionClient,
    registrationId: string,
    sessionId: string | null,
    actorId: string,
    checkedInAt: Date,
  ) {
    if (!sessionId && (await this.findAttendance(tx, registrationId, sessionId))) return { count: 0 };
    return tx.eventAttendance.createMany({
      data: {
        registrationId,
        sessionId,
        checkedInAt,
        checkedInById: actorId,
        checkedInOffline: false,
        syncedAt: null,
      },
      skipDuplicates: true,
    });
  }

  findAttendance(tx: Prisma.TransactionClient, registrationId: string, sessionId: string | null) {
    return tx.eventAttendance.findFirst({
      where: { registrationId, sessionId },
      select: { checkedInAt: true },
    });
  }
}
