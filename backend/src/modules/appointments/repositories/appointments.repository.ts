import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { AppointmentStatusTitle } from '../../availability/enums/appointment-status-title.enum.js';
import { APPOINTMENT_SELECT } from '../constants/appointment-select.constants.js';
import type { AppointmentRecord } from '../types/appointment-record.types.js';
import type { MyAppointmentsQuery } from '../types/my-appointments-query.types.js';

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMine(
    userId: string,
    scope: MyAppointmentsQuery['scope'],
    now: Date,
  ): Promise<AppointmentRecord[]> {
    return this.prisma.appointment.findMany({
      where: {
        OR: [{ mentorId: userId }, { studentId: userId }],
        endAt: scope === 'upcoming' ? { gt: now } : { lte: now },
        status: {
          title: {
            in: [
              AppointmentStatusTitle.CONFIRMED,
              AppointmentStatusTitle.LEGACY_CONFIRMED,
            ],
          },
        },
      },
      orderBy:
        scope === 'upcoming'
          ? [{ startAt: 'asc' }, { id: 'asc' }]
          : [{ endAt: 'desc' }, { startAt: 'desc' }, { id: 'asc' }],
      select: APPOINTMENT_SELECT,
    });
  }

  findById(id: string): Promise<AppointmentRecord | null> {
    return this.prisma.appointment.findUnique({
      where: { id },
      select: APPOINTMENT_SELECT,
    });
  }
}
