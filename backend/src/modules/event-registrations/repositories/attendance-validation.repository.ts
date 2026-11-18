import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import type { AttendanceReference } from '../requests/attendance-check-in.request.js';

@Injectable()
export class AttendanceValidationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPassInWorkshop(eventId: string, reference: AttendanceReference, tx: Prisma.TransactionClient = this.prisma) {
    return tx.eventRegistration.findFirst({
      where: {
        eventId,
        ...(reference.kind === 'qrToken' ? { qrToken: reference.value } : { id: reference.value }),
      },
      select: {
        id: true,
        cancelledAt: true,
        status: { select: { title: true } },
      },
    });
  }
}
