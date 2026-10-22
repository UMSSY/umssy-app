import { Injectable } from '@nestjs/common';
import type { BlockedDate } from '../../../prisma/client.js';
import { lockMentorDay } from '../../../common/prisma/lock-mentor-day.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionClient } from '../../../common/types/transaction-client.types.js';
import { ACTIVE_APPOINTMENT_STATUSES } from '../constants/appointment-status.constants.js';

@Injectable()
export class BlockedDatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  withDayLock<T>(
    mentorId: string,
    day: string,
    work: (tx: TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await lockMentorDay(tx, mentorId, day);
      return work(tx);
    });
  }

  findByDay(
    mentorId: string,
    blockedOn: Date,
    client: TransactionClient = this.prisma,
  ): Promise<BlockedDate | null> {
    return client.blockedDate.findUnique({
      where: { mentorId_blockedOn: { mentorId, blockedOn } },
    });
  }

  findById(id: string): Promise<BlockedDate | null> {
    return this.prisma.blockedDate.findUnique({ where: { id } });
  }

  findInRange(mentorId: string, fromDay: Date, toDay: Date): Promise<BlockedDate[]> {
    return this.prisma.blockedDate.findMany({
      where: { mentorId, blockedOn: { gte: fromDay, lte: toDay } },
      orderBy: { blockedOn: 'asc' },
    });
  }

  async hasActiveAppointmentBetween(
    mentorId: string,
    from: Date,
    to: Date,
    client: TransactionClient = this.prisma,
  ): Promise<boolean> {
    const count = await client.availabilityBlock.count({
      where: {
        mentorId,
        startAt: { gte: from, lt: to },
        appointments: { some: { status: { title: { in: ACTIVE_APPOINTMENT_STATUSES } } } },
      },
    });
    return count > 0;
  }

  create(
    mentorId: string,
    blockedOn: Date,
    reason: string | null,
    client: TransactionClient = this.prisma,
  ): Promise<BlockedDate> {
    return client.blockedDate.create({ data: { mentorId, blockedOn, reason } });
  }

  delete(id: string): Promise<BlockedDate> {
    return this.prisma.blockedDate.delete({ where: { id } });
  }
}
