import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import { PUBLISHED_STATUS_TITLE } from '../../events/constants/events.constants.js';
import type { AttendanceReference } from '../requests/attendance-check-in.request.js';

@Injectable()
export class AttendanceValidationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManagedWorkshop(eventId: string, userId: string, tx: Prisma.TransactionClient = this.prisma) {
    return tx.event.findFirst({
      where: {
        id: eventId,
        createdById: userId,
        status: { title: PUBLISHED_STATUS_TITLE },
      },
      select: { id: true, eventDate: true, startTime: true, endTime: true },
    });
  }

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
