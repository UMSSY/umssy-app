import { Injectable } from '@nestjs/common';
import type { AvailabilityBlock } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionClient } from '../../../common/types/transaction-client.types.js';
import {
  BLOCK_WITH_ACTIVE_APPOINTMENTS_INCLUDE,
  BLOCK_WITH_APPOINTMENT_DETAIL_INCLUDE,
} from '../constants/block-query.constants.js';
import { ACTIVE_APPOINTMENT_STATUSES } from '../constants/appointment-status.constants.js';
import type { AvailabilityBlockWithAppointmentDetail } from '../types/availability-block-with-appointment-detail.types.js';
import type { AvailabilityBlockWithAppointments } from '../types/availability-block-with-appointments.types.js';
import type { UpdateBlockData } from '../types/update-block-data.types.js';
import type { BlockSeriesData } from '../types/block-series-data.types.js';

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    mentorId: string,
    startAt: Date,
    endAt: Date,
    client: TransactionClient = this.prisma,
    series?: BlockSeriesData,
  ): Promise<AvailabilityBlock> {
    return client.availabilityBlock.create({
      data: { mentorId, startAt, endAt, ...series },
    });
  }

  findMentorBlocksInRange(
    mentorId: string,
    from: Date,
    to: Date,
  ): Promise<AvailabilityBlockWithAppointmentDetail[]> {
    return this.prisma.availabilityBlock.findMany({
      where: { mentorId, startAt: { gte: from, lt: to } },
      orderBy: { startAt: 'asc' },
      include: BLOCK_WITH_APPOINTMENT_DETAIL_INCLUDE,
    });
  }

  findMentorFreeBlocksInRange(mentorId: string, from: Date, to: Date): Promise<AvailabilityBlockWithAppointments[]> {
    return this.prisma.availabilityBlock.findMany({
      where: {
        mentorId,
        startAt: { gte: from, lt: to },
        appointments: { none: { status: { title: { in: ACTIVE_APPOINTMENT_STATUSES } } } },
      },
      orderBy: { startAt: 'asc' },
      include: BLOCK_WITH_ACTIVE_APPOINTMENTS_INCLUDE,
    });
  }

  findById(
    id: string,
    client: TransactionClient = this.prisma,
  ): Promise<AvailabilityBlockWithAppointments | null> {
    return client.availabilityBlock.findUnique({
      where: { id },
      include: BLOCK_WITH_ACTIVE_APPOINTMENTS_INCLUDE,
    });
  }

  update(
    id: string,
    data: UpdateBlockData,
    client: TransactionClient = this.prisma,
  ): Promise<AvailabilityBlockWithAppointments> {
    return client.availabilityBlock.update({
      where: { id },
      data,
      include: BLOCK_WITH_ACTIVE_APPOINTMENTS_INCLUDE,
    });
  }

  delete(id: string): Promise<AvailabilityBlock> {
    return this.prisma.availabilityBlock.delete({ where: { id } });
  }
}
