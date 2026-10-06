import { Injectable } from '@nestjs/common';
import type { AvailabilityBlock } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  BLOCK_WITH_ACTIVE_APPOINTMENTS_INCLUDE,
  WITHOUT_ACTIVE_APPOINTMENTS_WHERE,
} from '../constants/block-query.constants.js';
import type { AvailabilityBlockWithAppointments } from '../types/availability-block-with-appointments.types.js';
import type { UpdateBlockData } from '../types/update-block-data.types.js';

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(mentorId: string, startAt: Date, endAt: Date): Promise<AvailabilityBlock> {
    return this.prisma.availabilityBlock.create({
      data: { mentorId, startAt, endAt },
    });
  }

  findMentorBlocksInRange(
    mentorId: string,
    from: Date,
    to: Date,
  ): Promise<AvailabilityBlockWithAppointments[]> {
    return this.prisma.availabilityBlock.findMany({
      where: { mentorId, startAt: { gte: from, lt: to } },
      orderBy: { startAt: 'asc' },
      include: BLOCK_WITH_ACTIVE_APPOINTMENTS_INCLUDE,
    });
  }

  findMentorFreeBlocksInRange(mentorId: string, from: Date, to: Date): Promise<AvailabilityBlockWithAppointments[]> {
    return this.prisma.availabilityBlock.findMany({
      where: { mentorId, startAt: { gte: from, lt: to }, ...WITHOUT_ACTIVE_APPOINTMENTS_WHERE },
      orderBy: { startAt: 'asc' },
      include: BLOCK_WITH_ACTIVE_APPOINTMENTS_INCLUDE,
    });
  }

  findById(id: string): Promise<AvailabilityBlockWithAppointments | null> {
    return this.prisma.availabilityBlock.findUnique({
      where: { id },
      include: BLOCK_WITH_ACTIVE_APPOINTMENTS_INCLUDE,
    });
  }

  update(id: string, data: UpdateBlockData): Promise<AvailabilityBlockWithAppointments> {
    return this.prisma.availabilityBlock.update({
      where: { id },
      data,
      include: BLOCK_WITH_ACTIVE_APPOINTMENTS_INCLUDE,
    });
  }

  delete(id: string): Promise<AvailabilityBlock> {
    return this.prisma.availabilityBlock.delete({ where: { id } });
  }

  // TODO: provisional, este módulo no debe leer users; borrar al usar el servicio de Epic 6 (#695)
  async isActiveMentor(mentorId: string, now: Date): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        id: mentorId,
        isActive: true,
        roles: { some: { deletedAt: null, startAt: { lte: now }, role: { name: 'mentor' } } },
      },
    });
    return count > 0;
  }
}
